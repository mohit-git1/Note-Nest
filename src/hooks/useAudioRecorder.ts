import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cleanText } from '@/lib/cleanText';

export function useAudioRecorder() {
  const { isRecording, setIsRecording, addTranscriptLine } = useAppStore();
  const [isTranscribing, setIsTranscribing] = useState(false);

  // References for Web Audio & Media Streams
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // References for Double-Buffered Recorders
  const activeRecorderRef = useRef<MediaRecorder | null>(null);
  const nextRecorderRef = useRef<MediaRecorder | null>(null);
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const overlapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Upload Queue System
  const uploadQueueRef = useRef<Blob[]>([]);
  const isUploadingRef = useRef(false);
  const chunkCounterRef = useRef(0);

  // Determine supported mimeType
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm';
  };

  const processUploadQueue = async () => {
    if (isUploadingRef.current || uploadQueueRef.current.length === 0) {
      if (uploadQueueRef.current.length === 0) {
        setIsTranscribing(false);
      }
      return;
    }

    isUploadingRef.current = true;
    setIsTranscribing(true);

    const blob = uploadQueueRef.current.shift();
    if (!blob) {
      isUploadingRef.current = false;
      setIsTranscribing(false);
      return;
    }

    chunkCounterRef.current += 1;
    const chunkId = chunkCounterRef.current;
    const sizeKB = (blob.size / 1024).toFixed(1);
    console.log(`[AudioRecorder] Sending Chunk #${chunkId} to Whisper API (${sizeKB} KB)`);

    try {
      const formData = new FormData();
      const mimeType = blob.type || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const audioFile = new File([blob], `audio_chunk_${chunkId}.${ext}`, { type: mimeType });
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
          stopRecording();
          return;
        }
        throw new Error(`Transcription API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const cleanedText = cleanText(data.text);

      console.log(`[AudioRecorder] Chunk #${chunkId} Transcribed successfully:`, cleanedText ? `"${cleanedText}"` : '(Empty/Silence)');

      if (cleanedText && cleanedText.length > 0) {
        addTranscriptLine(cleanedText);
      }
    } catch (error) {
      console.error(`[AudioRecorder] Chunk #${chunkId} processing failed:`, error);
    } finally {
      isUploadingRef.current = false;
      // Process remaining items in queue
      processUploadQueue();
    }
  };

  const enqueueChunk = (blob: Blob) => {
    if (blob.size < 1000) {
      console.warn(`[AudioRecorder] Ignoring tiny chunk of size ${blob.size} bytes`);
      return;
    }
    uploadQueueRef.current.push(blob);
    processUploadQueue();
  };

  const startRecorderInstance = (stream: MediaStream, mimeType: string): MediaRecorder => {
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        enqueueChunk(event.data);
      }
    };
    return recorder;
  };

  const scheduleNextSegment = (stream: MediaStream, mimeType: string) => {
    // Overlap: Start next recorder 500ms before current 30s window ends
    const OVERLAP_MS = 500;
    const INTERVAL_MS = 30000;

    overlapTimerRef.current = setTimeout(() => {
      // Create and start next recorder to catch overlap frames
      try {
        nextRecorderRef.current = startRecorderInstance(stream, mimeType);
        nextRecorderRef.current.start();
      } catch (err) {
        console.error('[AudioRecorder] Failed to start next recorder instance:', err);
      }

      // 500ms later (at exactly 30s boundary), stop current recorder and swap
      rotationTimerRef.current = setTimeout(() => {
        if (activeRecorderRef.current && activeRecorderRef.current.state !== 'inactive') {
          activeRecorderRef.current.stop();
        }
        activeRecorderRef.current = nextRecorderRef.current;
        nextRecorderRef.current = null;

        // Schedule next rotation if still recording
        if (useAppStore.getState().isRecording) {
          scheduleNextSegment(stream, mimeType);
        }
      }, OVERLAP_MS);
    }, INTERVAL_MS - OVERLAP_MS);
  };

  const stopRecording = useCallback(() => {
    // Clear timers
    if (overlapTimerRef.current) {
      clearTimeout(overlapTimerRef.current);
      overlapTimerRef.current = null;
    }
    if (rotationTimerRef.current) {
      clearTimeout(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }

    // Stop active recorders
    if (activeRecorderRef.current && activeRecorderRef.current.state !== 'inactive') {
      try { activeRecorderRef.current.stop(); } catch (e) {}
    }
    if (nextRecorderRef.current && nextRecorderRef.current.state !== 'inactive') {
      try { nextRecorderRef.current.stop(); } catch (e) {}
    }
    activeRecorderRef.current = null;
    nextRecorderRef.current = null;

    // Stop stream tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach((track) => track.stop());
      systemStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    destinationNodeRef.current = null;

    // Update store state
    setIsRecording(false);
    useAppStore.getState().setSuggestionTimerPaused(false);
    useAppStore.getState().setSuggestionCountdown(30);
    console.log('[AudioRecorder] Recording stopped and resources cleaned up.');
  }, [setIsRecording]);

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

      // Reset counters & queue
      chunkCounterRef.current = 0;
      uploadQueueRef.current = [];

      // 1. CAPTURE MICROPHONE AUDIO
      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        micStreamRef.current = micStream;
      } catch (err) {
        console.error('[AudioRecorder] Microphone access error:', err);
        alert('Could not access microphone. Please check permissions.');
        return;
      }

      // 2. CAPTURE SYSTEM AUDIO (Optional / DisplayMedia)
      let systemStream: MediaStream | null = null;
      try {
        systemStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        systemStreamRef.current = systemStream;

        // Stop video tracks immediately as we only need system audio
        systemStream.getVideoTracks().forEach((track) => {
          track.stop();
          console.log('[AudioRecorder] System display video track stopped to conserve resources.');
        });

        const audioTracks = systemStream.getAudioTracks();
        if (audioTracks.length === 0 || audioTracks[0].muted) {
          console.warn('[AudioRecorder] WARNING: System audio track is missing or muted! Ensure "Share tab audio" or system sound sharing is enabled in the prompt.');
          useAppStore.getState().setNotification({
            type: 'info',
            message: 'System audio track not granted or muted. Recording microphone only. Enable "Share tab/system audio" when sharing screen.'
          });
        } else {
          console.log('[AudioRecorder] System audio track captured successfully:', audioTracks[0].label);
        }
      } catch (err: any) {
        if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
          console.warn('[AudioRecorder] System audio capture failed or not supported:', err);
        } else {
          console.log('[AudioRecorder] User declined system audio sharing, proceeding with microphone only.');
        }
      }

      // 3. STREAM MIXING WITH AudioContext
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const destinationNode = audioCtx.createMediaStreamDestination();
      destinationNodeRef.current = destinationNode;

      // Connect Microphone stream
      const micSource = audioCtx.createMediaStreamSource(micStream);
      const micGain = audioCtx.createGain();
      micGain.gain.value = 1.0;
      micSource.connect(micGain);
      micGain.connect(destinationNode);

      // Connect System stream if audio track exists
      if (systemStream && systemStream.getAudioTracks().length > 0) {
        const sysTrack = systemStream.getAudioTracks()[0];
        if (!sysTrack.muted && sysTrack.readyState === 'live') {
          const systemSource = audioCtx.createMediaStreamSource(systemStream);
          const systemGain = audioCtx.createGain();
          systemGain.gain.value = 1.0;
          systemSource.connect(systemGain);
          systemGain.connect(destinationNode);
        }
      }

      const mixedStream = destinationNode.stream;
      const mimeType = getSupportedMimeType();
      console.log(`[AudioRecorder] Mixing streams complete. AudioContext sampleRate: ${audioCtx.sampleRate}Hz | MimeType: ${mimeType}`);

      // 4. START CHUNKING WITH DOUBLE-BUFFERED ROTATION
      const firstRecorder = startRecorderInstance(mixedStream, mimeType);
      activeRecorderRef.current = firstRecorder;
      firstRecorder.start();

      setIsRecording(true);
      useAppStore.getState().setSuggestionTimerPaused(true);
      useAppStore.getState().setSuggestionCountdown(30);

      // Schedule subsequent 30s segments
      scheduleNextSegment(mixedStream, mimeType);

    } catch (err) {
      console.error('[AudioRecorder] Error starting audio recorder:', err);
      stopRecording();
      alert('Failed to start audio recording.');
    }
  }, [stopRecording, setIsRecording]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  };
}

