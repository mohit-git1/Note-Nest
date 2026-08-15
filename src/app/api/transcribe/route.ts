import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGroqClient } from '@/lib/getGroqClient';

// Ensure the handler only runs server-side
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    let groq;
    try {
      groq = await getGroqClient(session?.user?.id || 'guest');
    } catch (e: any) {
      if (e.message === 'NO_API_KEY') {
        return NextResponse.json(
          { error: 'Please add your Groq API key in Settings' },
          { status: 403 }
        );
      }
      throw e;
    }

    const formData = await req.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log(`[Transcribe API] Processing incoming file: name=${file.name}, size=${file.size} bytes, type=${file.type}`);

    // Call Groq API with whisper-large-v3
    // Omitting language allows Whisper to auto-detect any spoken language automatically
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      response_format: 'json',
      temperature: 0.0,
    });

    console.log(`[Transcribe API] Groq result: length=${transcription.text?.length || 0} chars`);

    return NextResponse.json({ text: transcription.text || '' });
  } catch (error: any) {
    console.error('[Transcribe API] Error during transcription:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

