import { useRef, memo, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

interface TranscriptWindowProps {
  stream: MediaStream | null;
  transcription: string;
  autoScroll: boolean;
  setAutoScroll: (value: boolean) => void;
}

const TranscriptDisplay = memo(
  ({ text, autoScroll }: { text: string; autoScroll: boolean }) => {
    const transcriptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (autoScroll && transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
    }, [text, autoScroll]);

    return (
      <div ref={transcriptRef} className="absolute inset-0 overflow-y-auto p-2">
        <div className="rounded-lg bg-neutral-100 bg-opacity-50 p-4">
          {text || "Listening..."}
        </div>
      </div>
    );
  }
);

export function TranscriptWindow({ stream, transcription, autoScroll, setAutoScroll }: TranscriptWindowProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoMounted, setIsVideoMounted] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream && !isVideoMounted) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
      videoRef.current.muted = true;
      setIsVideoMounted(true);
    }
  }, [stream, isVideoMounted]);

  return (
    <div className="flex flex-1 flex-col max-w-[400px]">
      <div className="relative border-b">
        <video ref={videoRef} className="w-full max-h-[55vh]" />
        <div className="absolute z-20 flex flex-row gap-2 left-2 top-2">
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 opacity-50 transition-opacity hover:opacity-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-maximize2 mr-2 h-4 w-4"
            >
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" x2="14" y1="3" y2="10"></line>
              <line x1="3" x2="10" y1="21" y2="14"></line>
            </svg>
            Fullscreen
          </button>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 opacity-50 transition-opacity hover:opacity-100">
            Change Tab
          </button>
        </div>
      </div>
      <div className="z-10 flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-row justify-between border-b bg-white bg-opacity-75 p-3">
          <span className="text-lg font-medium">Client Side</span>
          <span className="flex items-center gap-2 text-sm">
            AutoScroll{" "}
            <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden bg-white bg-opacity-50">
          <div className="absolute inset-0 overflow-y-auto p-2">
            <TranscriptDisplay text={transcription} autoScroll={autoScroll} />
          </div>
        </div>
      </div>
    </div>
  );
}