import { create } from 'zustand'

interface TranscriptionMessage  {
  text: string;
  timestamp: string;
  source: 'Sales_Agent' | 'Client';
}

interface TranscriptionStore {
  messages: TranscriptionMessage[];
  addMessage: (message: TranscriptionMessage) => void;
}

export const useTranscriptionStore = create<TranscriptionStore>((set) => ({
  messages: [],
  addMessage: (message) => 
    set((state) => {
      const newMessages = [...state.messages, message];
      console.log('Updated Messages:', newMessages); // Logs every time messages are updated
      return { messages: newMessages };
    }),
  clearMessages: () => set({ messages: [] })
}));