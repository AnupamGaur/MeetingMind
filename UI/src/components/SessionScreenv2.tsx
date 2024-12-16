import { useEffect, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { MicrophoneWindow } from "./MicrophoneWindow";
import { TranscriptWindow } from "./TranscriptWindow";
import { useTranscriptionStore } from "@/store";
import { useStreamingLLM } from '../useStreamingLLM'

interface SessionScreenProps {
  stream: MediaStream | null;
  transcription: string;
}
export interface Message {
  type: 'chatHistory' | 'llm';
  content: string;
}


export default function SessionScreen({
  stream,
  transcription,
}: SessionScreenProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState(transcription);

  const { streamingResponse, sendTranscript } = useStreamingLLM();


  useEffect(() => {
    setCurrentTranscription(transcription);
  }, [transcription]);

  const handleGenerate = () => {
    const allMessages = useTranscriptionStore.getState().messages;
    if (allMessages.length) {
      const combinedTranscript = allMessages
        .map(msg => `${msg.source}:${msg.text}\n`)
        .join('\n');
    
      sendTranscript(combinedTranscript, (response) => {
        // Update messages with the streaming response
        setMessages(prev => {
          const newMessages = [...prev];
          // Find the LLM message and update it
          const llmIndex = newMessages.findIndex(msg => msg.type === 'llm');
          if (llmIndex !== -1) {
            newMessages[llmIndex] = { type: 'llm', content: response };
          }
          return newMessages;
        });
      });
  
      setMessages(prev => [...prev, 
        { type: 'chatHistory', content: combinedTranscript },
        { type: 'llm', content: streamingResponse }  // Initial empty or current response
      ]);
      setCurrentTranscription('');
    }
  };

  const handleClearAnswers = () => {
    setMessages([]);
  };

  return (
    <div>
      <div className="relative flex max-h-svh min-h-svh w-full max-w-[1520px] flex-row overflow-hidden border-x">
        <TranscriptWindow 
          stream={stream}
          transcription={currentTranscription}
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
        />
        <ChatWindow 
          messages={messages}
          onGenerate={handleGenerate}
          onClear={handleClearAnswers}
        />
        <MicrophoneWindow 
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
        />
      </div>
    </div>
  );
}