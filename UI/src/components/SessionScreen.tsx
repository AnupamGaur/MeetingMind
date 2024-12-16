import { useRef, useState, useEffect, memo } from "react";
import { Switch } from "@/components/ui/switch";

interface SessionScreenProps {
  stream: MediaStream | null;
  transcription: string;
}

interface TranscriptDisplayProps {
  text: string;
  autoScroll: boolean;
}

const processTranscription = async (transcription: string) => {};

const TranscriptDisplay = memo(
  ({ text, autoScroll }: TranscriptDisplayProps) => {
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

export default function SessionScreen({
  stream,
  transcription,
}: SessionScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoMounted, setIsVideoMounted] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream && !isVideoMounted) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
      videoRef.current.muted = true;
      setIsVideoMounted(true);
    }
  }, [stream, isVideoMounted]);

  return (
    <div>
      <div className="relative flex max-h-svh min-h-svh w-full max-w-[1520px] flex-row overflow-hidden border-x">
        <div className="flex flex-1 flex-col max-w-[400px]">
          <div className="relative border-b">
            <div className="vsc-controller vsc-nosource"></div>
            <video ref={videoRef} className="w-full max-h-[55vh]" />
            <div className="absolute inset-0 bg-transparent"></div>
            <div className="absolute z-20 flex flex-row gap-2 left-2 top-2">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 opacity-50 transition-opacity hover:opacity-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
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
              <span className="text-lg font-medium">📝 Transcript</span>
              <span className="flex items-center gap-2 text-sm">
                AutoScroll{" "}
                <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
              </span>
            </div>
            <div className="relative flex-1 overflow-hidden bg-white bg-opacity-50">
              <div className="absolute inset-0 overflow-y-auto p-2">
                <TranscriptDisplay
                  text={transcription}
                  autoScroll={autoScroll}
                />
              </div>
              <div className="absolute bottom-0 right-0 p-4">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 opacity-50 transition-opacity hover:opacity-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-x mr-2 h-4 w-4"
                  >
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                  Clear Transcript
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="z-10 flex flex-1 flex-col border-x">
          <div className="flex flex-row justify-between border-b bg-white bg-opacity-75 p-3">
            <img
              alt="ParakeetAI Logo"
              loading="lazy"
              width="124"
              height="34"
              decoding="async"
              data-nimg="1"
              className="w-auto"
              src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.f1e20d7d.png&amp;w=256&amp;q=75"
              style={{ color: "transparent", height: "34px" }}
            />
          </div>
          <div className="relative flex-1 overflow-hidden bg-white bg-opacity-50">
            <div className="absolute inset-0 flex flex-col gap-y-2 overflow-y-auto p-2">
              {" "}
              {transcription && (
                <div className="rounded-lg p-4 bg-blue-200 bg-opacity-50">
                  <div className="flex flex-col gap-2">
                    <p>
                      <strong>Candidate</strong>:
                    </p>
                    <p>
                      <strong>Interviewer</strong>: {transcription}
                    </p>
                  </div>
                </div>
              )}
              <div className="rounded-lg bg-neutral-100 bg-opacity-60 p-4">
                <div className="flex flex-col gap-2">
                  <p>
                    💬 <strong>Summarized question</strong>: How can I edit and
                    enhance my conversation in the ChatGPT app?
                  </p>
                  <p>
                    ⭐️ <strong>Answer</strong>:
                  </p>
                  <ul>
                    <li>
                      You can click on the blue ChatGPT icon at the bottom of
                      the app to open it.
                    </li>
                    <li>
                      This will integrate all your previous conversations into
                      the ChatGPT interface.
                    </li>
                    <li>
                      Once opened, you can perform various actions such as
                      editing your conversation.
                    </li>
                    <li>
                      You can also enhance your conversation by adding elements
                      like emojis to your playlist or other text modifications.
                    </li>
                    <li>
                      The app allows for a seamless experience to manage and
                      personalize your interactions with ChatGPT.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 opacity-50 transition-opacity hover:opacity-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="lucide lucide-x mr-2 h-4 w-4"
                >
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
                Clear Answers
              </button>
            </div>
          </div>
          <div className="flex flex-row justify-between border-t bg-white bg-opacity-75 p-4">
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 relative !px-0 !py-0">
                <div className="absolute -inset-2 rounded-lg bg-gradient-to-br from-sky-300 to-lime-300 blur"></div>
                <div className="relative flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 hover:bg-primary/80">
                  Generate Response
                </div>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-white p-2" data-state="closed">
                ⏰ 7 mins
              </div>
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2">
                Exit
              </button>
            </div>
          </div>
        </div>
        <div className="flex max-w-[400px] flex-1 flex-col">
          <div className="z-10 flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-row justify-between border-b bg-white bg-opacity-75 p-3">
              <span className="text-lg font-medium">🎙️ Microphone</span>
              <span className="flex items-center gap-2 text-sm">
                AutoScroll{" "}
                <button
                  type="button"
                  role="switch"
                  aria-checked="true"
                  data-state="checked"
                  value="on"
                  className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                >
                  <span
                    data-state="checked"
                    className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                  ></span>
                </button>
              </span>
            </div>
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-white bg-opacity-50">
              <div className="m-2 flex flex-col items-center justify-center gap-4 rounded-lg bg-neutral-100 bg-opacity-50 p-4 text-center">
                <div className="text-lg font-medium">
                  Microphone Transcription
                <div className="flex flex-row gap-2">
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Connect Microphone
                  </button>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Close
                  </button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex flex-row justify-between gap-2 p-4">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 opacity-50 transition-opacity hover:opacity-100">
                  Stop Microphone
                </button>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 opacity-50 transition-opacity hover:opacity-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-x mr-2 h-4 w-4"
                  >
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                  Clear Transcript
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
