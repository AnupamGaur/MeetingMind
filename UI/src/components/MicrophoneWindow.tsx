import { useState, useEffect, useRef } from 'react';
import { Switch } from "./ui/switch";
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import {useTranscriptionStore} from '../store.ts';


interface MicrophoneWindowProps {
  autoScroll: boolean;
  setAutoScroll: (value: boolean) => void;
}

export function MicrophoneWindow({ autoScroll, setAutoScroll }: MicrophoneWindowProps) {
  const addMessage = useTranscriptionStore((state) => state.addMessage);
  const [isRecording, setIsRecording] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  
  // References for cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  const transcribeClientRef = useRef<TranscribeStreamingClient | null>(null);
  const transcriptionDivRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    // const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    
    return `${hours}:${minutes}:${seconds}.`;
  };

  useEffect(() => {
    const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  
    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials not found in environment variables');
      return;
    }
  
    transcribeClientRef.current = new TranscribeStreamingClient({
      region: "ap-south-1",
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    return () => {
      stopRecording();
    };
  }, []);

  // Auto scroll effect
  useEffect(() => {
    if (autoScroll && transcriptionDivRef.current) {
      transcriptionDivRef.current.scrollTop = transcriptionDivRef.current.scrollHeight;
    }
  }, [transcription, autoScroll]);

  const startTranscription = async (audioStream: MediaStream) => {
    if (!transcribeClientRef.current) return;

    try {
      // Setup audio context
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      const processor = audioContextRef.current.createScriptProcessor(256, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      let audioData: Int16Array[] = [];
      
      // Process audio data
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        if (audioData.length < 100) {
          audioData.push(pcmData);
        }
      };

      // Setup AWS Transcribe stream
      const transcribeStream = new StartStreamTranscriptionCommand({
        LanguageCode: "en-US",
        MediaEncoding: "pcm",
        MediaSampleRateHertz: 44100,
        EnablePartialResultsStabilization: true,
        PartialResultsStability: "low",
        ShowSpeakerLabel: false,
        AudioStream: async function* () {
          let buffer = new Int16Array(0);
          const CHUNK_SIZE = 2048;
          
          while (true) {
            if (audioData.length > 0) {
              const chunk = audioData.shift();
              if (chunk) {
                const newBuffer = new Int16Array(buffer.length + chunk.length);
                newBuffer.set(buffer);
                newBuffer.set(chunk, buffer.length);
                buffer = newBuffer;
                
                if (buffer.length >= CHUNK_SIZE) {
                  yield { AudioEvent: { AudioChunk: new Uint8Array(buffer.buffer) } };
                  buffer = new Int16Array(0);
                }
              }
            }
            await new Promise(resolve => setTimeout(resolve, 5));
          }
        }()
      });

      // Start transcription
      const response = await transcribeClientRef.current.send(transcribeStream);

      // Handle transcription results
      if (response.TranscriptResultStream) {
        try {
          for await (const event of response.TranscriptResultStream) {
            if (event.TranscriptEvent?.Transcript?.Results) {
              const results = event.TranscriptEvent.Transcript.Results;
              for (const result of results) {
                if (result.Alternatives && result.Alternatives.length > 0) {
                  const transcript = result.Alternatives[0].Transcript;
                  if (transcript) {
                    if (result.IsPartial) {
                      setTranscription(prev => {
                        const lines = prev.split('\n');
                        if (lines[lines.length - 1].startsWith('(partial) ')) {
                          lines[lines.length - 1] = '(partial) ' + transcript;
                        } else {
                          lines.push('(partial) ' + transcript);
                        }
                        return lines.join('\n');
                      });
                    } else {
                      const timestamp = formatTimestamp(new Date());
                      setTranscription(prev => 
                        prev.replace(/\(partial\)[^\n]*\n?$/, '') + `\n[${timestamp}] ${transcript}`
                      );
                      addMessage({
                        text: transcript,
                        timestamp: timestamp,
                        source: 'Sales_Agent'
                      })
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Microphone transcription stream error:", error);
        }
      }
    } catch (error) {
      console.error("Error starting microphone transcription:", error);
    }
  };

  const stopRecording = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      setMicStream(stream);
      setIsRecording(true);
      startTranscription(stream);

    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  return (
    <div className="flex max-w-[400px] flex-1 flex-col">
      <div className="z-10 flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-row justify-between border-b bg-white bg-opacity-75 p-3">
          <span className="text-lg font-medium">Sales Agent Side</span>
          <span className="flex items-center gap-2 text-sm">
            AutoScroll{" "}
            <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
          </span>
        </div>
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-white bg-opacity-50">
          {!isRecording ? (
            <div className="m-2 flex flex-col items-center justify-center gap-4 rounded-lg bg-neutral-100 bg-opacity-50 p-4 text-center">
              <div className="text-lg font-medium">
                Microphone Transcription
              </div>
              <div className="flex flex-row gap-2">
                <button 
                  onClick={startRecording}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Connect Microphone
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div 
                ref={transcriptionDivRef}
                className="flex-1 overflow-y-auto p-4 whitespace-pre-wrap"
              >
                {transcription}
              </div>
              <div className="p-4 border-t flex justify-center">
                <button 
                  onClick={stopRecording}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Stop Recording
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}