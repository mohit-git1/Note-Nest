import { create } from 'zustand';
import { ActionItem } from '@/types/actions';

export interface SuggestionItem {
  id: string;
  type: 'action_item' | 'question' | 'talking_point' | 'answer' | 'fact_check' | 'clarification';
  preview: string;
  full_prompt: string;
}

export interface SuggestionBatch {
  id: string;
  items: SuggestionItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export interface Notification {
  type: 'error' | 'success' | 'info';
  message: string;
}

interface AppState {
  transcript: string[];
  suggestions: SuggestionBatch[];
  chatMessages: ChatMessage[];
  isChatThinking: boolean;
  sessionId: string | null;
  isReadOnly: boolean;
  notification: Notification | null;

  // Recording & suggestion timer state
  isRecording: boolean;
  suggestionCountdown: number;
  isGeneratingSuggestions: boolean;
  suggestionTimerPaused: boolean;

  // New fields for Task/Goal Detection
  pendingActions: ActionItem[];
  transcriptLineBuffer: number;
  dismissAction: (id: string) => void;
  clearAllPendingActions: () => void;

  setSessionId: (id: string | null) => void;
  setIsReadOnly: (readOnly: boolean) => void;
  setNotification: (notification: Notification | null) => void;
  clearNotification: () => void;
  setIsRecording: (isRecording: boolean) => void;
  setSuggestionCountdown: (count: number) => void;
  setIsGeneratingSuggestions: (val: boolean) => void;
  setSuggestionTimerPaused: (val: boolean) => void;
  loadSession: (session: any) => void;
  addTranscriptLine: (line: string) => void;
  addSuggestionBatch: (batch: SuggestionBatch) => void;
  addChatMessage: (message: ChatMessage) => void;
  setIsChatThinking: (isThinking: boolean) => void;
  resetState: () => void;
}

// Background worker for detecting actions
async function detectActionsFromTranscript(lines: string[]) {
  try {
    const res = await fetch("/api/detect-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recentLines: lines })
    });
    const data = await res.json();
    if (data.actions?.length > 0) {
      const actionsWithIds = data.actions.map((a: any) => ({
        ...a,
        id: Math.random().toString(36).substring(7) + Date.now()
      }));
      useAppStore.setState(state => ({
        pendingActions: [...state.pendingActions, ...actionsWithIds]
      }));
    }
  } catch {
    // silent fail
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  transcript: [],
  suggestions: [],
  chatMessages: [],
  isChatThinking: false,
  sessionId: null,
  isReadOnly: false,
  notification: null,

  // Recording & suggestion timer defaults
  isRecording: false,
  suggestionCountdown: 30,
  isGeneratingSuggestions: false,
  suggestionTimerPaused: true, // paused until first recording stops

  // Task Detection defaults
  pendingActions: [],
  transcriptLineBuffer: 0,

  dismissAction: (id) => set(state => ({
    pendingActions: state.pendingActions.filter((a) => a.id !== id)
  })),

  clearAllPendingActions: () => set({ pendingActions: [] }),

  setSessionId: (id) => set({ sessionId: id }),
  setIsReadOnly: (readOnly) => set({ isReadOnly: readOnly }),
  setNotification: (notification) => set({ notification }),
  clearNotification: () => set({ notification: null }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setSuggestionCountdown: (count) => set({ suggestionCountdown: count }),
  setIsGeneratingSuggestions: (val) => set({ isGeneratingSuggestions: val }),
  setSuggestionTimerPaused: (val) => set({ suggestionTimerPaused: val }),

  loadSession: (session) => {
    set({
      sessionId: session._id,
      isReadOnly: true,
      transcript: session.transcript.map((t: any) => t.text),
      chatMessages: session.chatHistory.map((c: any) => ({
        id: c.timestamp,
        sender: c.role === 'user' ? 'user' : 'ai',
        text: c.content
      })),
      suggestions: []
    });
  },

  addTranscriptLine: async (line) => {
    set((state) => {
      const newBuffer = state.transcriptLineBuffer + 1;
      const newState = { 
        transcript: [...state.transcript, line],
        transcriptLineBuffer: newBuffer
      };

      if (newBuffer >= 5) {
        // We defer the execution of the detection to not block this reducer
        const last5 = newState.transcript.slice(-5);
        setTimeout(() => detectActionsFromTranscript(last5), 0);
        newState.transcriptLineBuffer = 0;
      }
      return newState;
    });

    const { sessionId } = get();
    if (sessionId?.startsWith('guest_')) {
      const localSessions = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
      const sessionIndex = localSessions.findIndex((s: any) => s.sessionId === sessionId);
      if (sessionIndex !== -1) {
        localSessions[sessionIndex].transcript.push({ text: line, speaker: 'Speaker 1' });
        // Update preview
        localSessions[sessionIndex].preview = localSessions[sessionIndex].transcript
          .slice(0, 2).map((t: any) => t.text).join(' ').substring(0, 60) + '...';
        localStorage.setItem('guest_sessions', JSON.stringify(localSessions));
      }
    } else if (sessionId) {
      try {
        await fetch(`/api/sessions/${sessionId}/transcript`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speaker: 'Speaker 1', text: line }),
        });
      } catch (err) {
        console.error('Failed to sync transcript line:', err);
      }
    }
  },

  addSuggestionBatch: (batch) =>
    set((state) => ({ suggestions: [batch, ...state.suggestions] })),

  addChatMessage: async (message) => {
    set((state) => ({ chatMessages: [...state.chatMessages, message] }));
    const { sessionId } = get();
    if (sessionId?.startsWith('guest_')) {
      const localSessions = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
      const sessionIndex = localSessions.findIndex((s: any) => s.sessionId === sessionId);
      if (sessionIndex !== -1) {
        localSessions[sessionIndex].chatHistory.push({
          role: message.sender === 'ai' ? 'assistant' : 'user',
          content: message.text,
          timestamp: message.id
        });
        localStorage.setItem('guest_sessions', JSON.stringify(localSessions));
      }
    } else if (sessionId) {
      try {
        await fetch(`/api/sessions/${sessionId}/chat`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            role: message.sender === 'ai' ? 'assistant' : 'user', 
            content: message.text 
          }),
        });
      } catch (err) {
        console.error('Failed to sync chat message:', err);
      }
    }
  },

  setIsChatThinking: (isThinking) =>
    set({ isChatThinking: isThinking }),

  resetState: () => set({
    transcript: [],
    suggestions: [],
    chatMessages: [],
    isChatThinking: false,
    sessionId: null,
    isReadOnly: false,
    isRecording: false,
    suggestionCountdown: 30,
    isGeneratingSuggestions: false,
    suggestionTimerPaused: true,
    pendingActions: [],
    transcriptLineBuffer: 0,
  }),
}));
