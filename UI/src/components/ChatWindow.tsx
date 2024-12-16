interface Message {
  type: 'chatHistory' | 'llm';
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  onGenerate: () => void;
  onClear: () => void;
}

export function ChatWindow({ messages, onGenerate, onClear }: ChatWindowProps) {

  const formatResponse = (text: string) => {
    // Split the response into parts based on special markers
    const parts = text.split(/(\*\*.*?\*\*|chatHistory:|AI Response:)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Handle bold text
        return (
          <strong key={index} className="font-bold">
            {part.replace(/\*\*/g, '')}
          </strong>
        );
      } else if (part === 'chatHistory:' || part === 'AI Response:') {
        // Handle headers
        return (
          <div key={index} className="font-semibold text-gray-600 mt-4 mb-2">
            {part}
          </div>
        );
      } else {
        // Handle regular text with preserved formatting
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      }
      return null;
    }).filter(Boolean);
  };

  return (
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
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`rounded-lg p-4 ${
                message.type === 'chatHistory' 
                  ? 'bg-blue-200 bg-opacity-50' 
                  : 'bg-neutral-100 bg-opacity-60'
              }`}
            >
              <div className="flex flex-col gap-2">
                <p>
                  <strong>
                    {message.type === 'chatHistory' ? 'chatHistory' : 'AI Response'}
                  </strong>: {formatResponse(message.content)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 right-0 p-4">
          <button 
            onClick={onClear}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 opacity-50 transition-opacity hover:opacity-100"
          >
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
          <button 
            onClick={onGenerate}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 relative !px-0 !py-0"
          >
            <div className="relative flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 hover:bg-primary/80">
              Generate
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-white p-2" data-state="closed">
          </div>
          {/* <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2">
            Exit
          </button> */}
        </div>
      </div>
    </div>
  );
}