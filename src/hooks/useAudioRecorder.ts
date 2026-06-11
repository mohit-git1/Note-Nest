import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cleanText } from '@/lib/cleanText';

export function useAudioRecorder() {
  const { isRecording, setIsRecording, addTranscriptLine } = useAppStore();
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Guard to debounce overlapping chunks 
  const isUploadingRef = useRef(false);

  const processAudioChunk = async (blob: Blob) => {
    if (isUploadingRef.current) return;
    
    isUploadingRef.current = true;
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      // Ensuring format strictly parses as webm standard file 
      const audioFile = new File([blob], 'audio_chunk.webm', { type: 'audio/webm' });
      formData.append('audio', audioFile);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          useAppStore.getState().setNotification({
            type: 'error',
            message: errorData.error || 'Please add your Groq API key in Settings'
          });
          // Stop recording so the user can fix the issue
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
             mediaRecorderRef.current.stop();
             mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
             setIsRecording(false);
          }
          return;
        }
        throw new Error('Transcription API failed');
      }

      const data = await response.json();
      const cleanedText = cleanText(data.text);
      
      // Prevent duplicate or empty transcripts
      if (cleanedText && cleanedText.length > 0) {
        addTranscriptLine(cleanedText);
      }
    } catch (error) {
      console.error('Audio processing chunk failed:', error);
    } finally {
      setIsTranscribing(false);
      // Minimal debounce timeout to prevent double-firing edge cases
      setTimeout(() => {
        isUploadingRef.current = false;
      }, 500);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      // Create session first
      const res = await fetch('/api/sessions', { method: 'POST' });
      if (res.ok) {
        const { sessionId } = await res.json();
        useAppStore.getState().setSessionId(sessionId);
      } else if (res.status === 401) {
        const guestSessionId = 'guest_' + Date.now();
        useAppStore.getState().setSessionId(guestSessionId);
        const guestSession = {
          sessionId: guestSessionId,
          startedAt: new Date().toISOString(),
          transcript: [],
          chatHistory: [],
          title: 'Guest Meeting'
        };
        const localSessions = JSON.parse(localStorage.getItem('guest_sessions') || '[]');
        localStorage.setItem('guest_sessions', JSON.stringify([guestSession, ...localSessions]));
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          // Convert blob properly as specifically requested
          const blob = new Blob([event.data], { type: 'audio/webm' });
          await processAudioChunk(blob);
        }
      };

      // 30 sec chunks
      mediaRecorder.start(30000); 

      // Update store — recording is active, pause suggestions
      setIsRecording(true);
      useAppStore.getState().setSuggestionTimerPaused(true);
      useAppStore.getState().setSuggestionCountdown(30);
      
    } catch (err) {
      console.error('Microphone permission or access error:', err);
      alert('Could not access microphone.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

      // Update store — recording stopped, un-pause suggestions
      setIsRecording(false);
      useAppStore.getState().setSuggestionTimerPaused(false);
      useAppStore.getState().setSuggestionCountdown(30);
    }
  }, [isRecording]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  };
}
