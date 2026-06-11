import { auth } from "@/auth"
import { getGroqClient } from "@/lib/getGroqClient"
import { ACTION_ITEM_DETECTION_PROMPT } from "@/lib/prompts"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  
  const { recentLines } = await req.json()
  if (!recentLines?.length) return NextResponse.json({ actions: [] })

  const groq = await getGroqClient(session?.user?.id || 'guest')

  const prompt = ACTION_ITEM_DETECTION_PROMPT.replace(
    "[TRANSCRIPT]",
    recentLines.join("\n")
  )

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    })

    const raw = response.choices[0]?.message?.content?.trim() ?? "[]"
    const actions = JSON.parse(raw)
    return NextResponse.json({ actions })
  } catch {
    return NextResponse.json({ actions: [] })
  }
}
