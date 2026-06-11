import { NextRequest, NextResponse } from 'next/server';
import { cleanText } from '@/lib/cleanText';
import { auth } from '@/auth';
import { getGroqClient } from '@/lib/getGroqClient';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';

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

    const body = await req.json();
    const { transcript, full_prompt, chatHistory } = body;
    const settings = body.settings || {};

    // Use settings from client or defaults
    const contextLines = settings.chatContextLines || 15;
    const model = settings.model || 'llama-3.3-70b-versatile';
    const temperature = settings.temperature ?? 0.7;
    const maxTokens = settings.maxTokens || 512;

    if (!full_prompt) {
      return NextResponse.json(
        { error: 'No full_prompt provided' },
        { status: 400 }
      );
    }

    const transcriptArray: string[] = transcript || [];
    
    // Process context cleanly 
    const recentLines = transcriptArray
      .slice(-contextLines)
      .map(cleanText)
      .filter(Boolean);

    const conversationContext = recentLines.join('\n');

    // Build chat history string
    const historyArray: { role: string; content: string }[] = chatHistory || [];
    const chatHistoryStr = historyArray
      .slice(-10)
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // Build system prompt from centralized prompt file
    const systemPrompt = CHAT_SYSTEM_PROMPT
      .replace('{{TRANSCRIPT}}', conversationContext || '(no transcript yet)')
      .replace('{{CHAT_HISTORY}}', chatHistoryStr || '(no prior messages)');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: full_prompt },
      ],
      model,
      temperature,
      max_tokens: maxTokens,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Groq returned empty chat content');
    }

    return NextResponse.json({ answer: content.trim() });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate chat answer' },
      { status: 500 }
    );
  }
}
