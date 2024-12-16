import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Monitor } from 'lucide-react';
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import SessionScreen from './SessionScreenv2';
import {useTranscriptionStore} from '../store'


export default function TabSharingInterface() {
  const addMessage = useTranscriptionStore((state) => state.addMessage);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentTab, setCurrentTab] = useState('');
  const [transcription, setTranscription] = useState<string>('');
  
  // References for cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcribeClientRef = useRef<TranscribeStreamingClient | null>(null);

  const formatTimestamp = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
  };

  useEffect(() => {
    const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
    console.log(accessKeyId,"this is accessKeyId")
    console.log(secretAccessKey,"this is secretAccessKey")
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
      stopTranscription();
    };
  }, []);

  
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
          // Scale to 16-bit range and clamp values
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        if (audioData.length < 100) { // Prevent buffer from growing too large
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
          const CHUNK_SIZE = 2048; // Send smaller chunks more frequently
          
          while (true) {
            if (audioData.length > 0) {
              const chunk = audioData.shift();
              if (chunk) {
                // Combine with existing buffer
                const newBuffer = new Int16Array(buffer.length + chunk.length);
                newBuffer.set(buffer);
                newBuffer.set(chunk, buffer.length);
                buffer = newBuffer;
                
                // Send if we have enough data
                if (buffer.length >= CHUNK_SIZE) {
                  yield { AudioEvent: { AudioChunk: new Uint8Array(buffer.buffer) } };
                  buffer = new Int16Array(0);
                }
              }
            }
            await new Promise(resolve => setTimeout(resolve, 5)); // Reduced delay
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
                      // For partial results, just replace the current partial line
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
                        prev.replace(/\(partial\)[^\n]*\n?$/, '') + ' ' + `\n${timestamp} ${transcript}`
                      );
                      addMessage({
                        text: transcript,
                        timestamp: timestamp,
                        source: 'Client'
                      })
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Transcription stream error:", error);
        }
      }
    } catch (error) {
      console.error("Error starting transcription:", error);
    }
  };

  const stopTranscription = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const startSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser'
        },
        audio: true
      });
      
      setStream(mediaStream);
      setIsSharing(true);
      
      // Get the tab title
      const tracks = mediaStream.getVideoTracks();
      if (tracks.length > 0) {
        setCurrentTab(tracks[0].label);
      }

      // Start transcription with audio tracks
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream([audioTracks[0]]);
        startTranscription(audioStream);
      }

      // Handle stream stop
      mediaStream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsSharing(false);
    setCurrentTab('');
    stopTranscription();
  };

  return (
    <div className="w-full mx-auto">
      <div>
        {isSharing && (
          <SessionScreen stream={stream} transcription={transcription}/>
        )}

        {!isSharing && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <button
              onClick={startSharing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
            >
              <Monitor className="w-5 h-5 mr-2" />
              Share Chrome Tab
            </button>
            <p className="text-gray-600 text-sm">
              Share your screen with audio to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}