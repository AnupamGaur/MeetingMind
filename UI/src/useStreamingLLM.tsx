import { useRef, useState } from "react";

export const useStreamingLLM = () => {
  const [streamingResponse, setStreamingResponse] = useState('');
  const ws = useRef<WebSocket | null>(null);

  const sendTranscript = (transcript: string, onMessage: (response: string) => void) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      ws.current = new WebSocket('ws://localhost:8000/ws');
      
      ws.current.onopen = () => {
        ws.current?.send(transcript);
      };
    } else {
      ws.current.send(transcript);
    }

    ws.current.onmessage = (event) => {
      setStreamingResponse(prev => {
        const newResponse = prev + event.data;
        onMessage(newResponse);
        return newResponse;
      });
    };
  };

  return { streamingResponse, sendTranscript };
};