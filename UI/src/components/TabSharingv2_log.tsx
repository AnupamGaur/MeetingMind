import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Monitor } from 'lucide-react';
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import SessionScreen from './SessionScreen';

export default function TabSharingInterface() {
  console.log('Rendering TabSharingInterface component');
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [currentTab, setCurrentTab] = useState('');
  const [transcription, setTranscription] = useState<string>('');
  
  console.log('Current state:', { 
    hasStream: !!stream, 
    isSharing, 
    currentTab, 
    transcriptionLength: transcription.length 
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcribeClientRef = useRef<TranscribeStreamingClient | null>(null);
  
  console.log('Refs state:', {
    hasAudioContext: !!audioContextRef.current,
    hasMediaRecorder: !!mediaRecorderRef.current,
    hasTranscribeClient: !!transcribeClientRef.current
  });

  useEffect(() => {
    console.log('Setting up AWS Transcribe client');
    const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  
    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials not found in environment variables');
      return;
    }
    
    console.log('Initializing TranscribeStreamingClient with region ap-south-1');
    transcribeClientRef.current = new TranscribeStreamingClient({
      region: "ap-south-1",
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    return () => {
      console.log('Cleanup: Stopping transcription');
      stopTranscription();
    };
  }, []);

  const startTranscription = async (audioStream: MediaStream) => {
    console.log('Starting transcription with audio stream:', audioStream);
    console.log('Audio tracks:', audioStream.getAudioTracks());
    
    if (!transcribeClientRef.current) {
      console.error('No transcribe client available');
      return;
    }

    try {
      console.log('Setting up AudioContext');
      audioContextRef.current = new AudioContext();
      console.log('AudioContext state:', audioContextRef.current.state);
      
      console.log('Creating MediaStreamSource');
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      
      console.log('Creating ScriptProcessor');
      const processor = audioContextRef.current.createScriptProcessor(256, 1, 1);
      
      console.log('Connecting audio nodes');
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      let audioData: Int16Array[] = [];
      
      console.log('Setting up audio processing handler');
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        if (audioData.length < 100) {
          audioData.push(pcmData);
        }
        console.log('Audio buffer processed, current buffer size:', audioData.length);
        console.log('Audio buffer processed, current buffer', audioData);
      };

      console.log('Creating AWS Transcribe command');
      const transcribeStream = new StartStreamTranscriptionCommand({
        LanguageCode: "en-US",
        MediaEncoding: "pcm",
        MediaSampleRateHertz: 44100,
        EnablePartialResultsStabilization: true,
        PartialResultsStability: "low",
        ShowSpeakerLabel: false,
        AudioStream: async function* () {
          console.log('Starting audio stream generator');
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
                  console.log('Sending audio chunk of size:', buffer.length);
                  yield { AudioEvent: { AudioChunk: new Uint8Array(buffer.buffer) } };
                  buffer = new Int16Array(0);
                }
              }
            }
            await new Promise(resolve => setTimeout(resolve, 5));
          }
        }()
      });

      console.log('Starting transcription stream');
      const response = await transcribeClientRef.current.send(transcribeStream);

      if (response.TranscriptResultStream) {
        console.log('Transcription stream started successfully');
        try {
          for await (const event of response.TranscriptResultStream) {
            if (event.TranscriptEvent?.Transcript?.Results) {
              const results = event.TranscriptEvent.Transcript.Results;
              console.log('Received transcription results:', results);
              
              for (const result of results) {
                if (result.Alternatives && result.Alternatives.length > 0) {
                  const transcript = result.Alternatives[0].Transcript;
                  if (transcript) {
                    console.log('Processing transcript:', {
                      isPartial: result.IsPartial,
                      content: transcript
                    });
                    
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
                      setTranscription(prev => {
                        const newTranscription = prev.replace(/\(partial\)[^\n]*\n?$/, '') + ' ' + transcript;
                        console.log('Updated transcription:', newTranscription);
                        return newTranscription;
                      });
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
    console.log('Stopping transcription');
    if (audioContextRef.current) {
      console.log('Closing AudioContext');
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      console.log('Stopping MediaRecorder');
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const startSharing = async () => {
    console.log('Starting screen sharing');
    try {
      console.log('Requesting display media');
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser'
        },
        audio: true
      });
      
      console.log('Display media obtained:', {
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length
      });
      
      setStream(mediaStream);
      setIsSharing(true);
      
      const tracks = mediaStream.getVideoTracks();
      if (tracks.length > 0) {
        const label = tracks[0].label;
        console.log('Setting current tab label:', label);
        setCurrentTab(label);
      }

      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('Creating audio stream for transcription');
        const audioStream = new MediaStream([audioTracks[0]]);
        startTranscription(audioStream);
      }

      mediaStream.getVideoTracks()[0].onended = () => {
        console.log('Video track ended, stopping sharing');
        stopSharing();
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopSharing = () => {
    console.log('Stopping sharing');
    if (stream) {
      console.log('Stopping all tracks');
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label);
        track.stop();
      });
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