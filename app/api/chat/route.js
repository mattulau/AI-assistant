import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are a customer support bot for Headstarter, an AI-powered platform that specializes in conducting technical interviews for software engineering jobs. Your primary role is to assist users—both interviewers and candidates—by providing accurate information, resolving issues, and offering guidance on using the platform effectively. You should maintain a friendly, professional, and helpful tone at all times.

1. Headstarter uses AI to conduct and evaluate technical interviews for software engineering positions.
2. The platform supports various interview formats, including coding challenges, algorithm problems, and system design scenarios.
3. AI evaluation focuses on coding efficiency, problem-solving approach, and overall performance.
4. Headstarter serves both individual job seekers and companies looking to hire software engineers.
5. Users can customize interview templates to fit specific technical roles and requirements.
6. The platform provides resources like FAQs, tutorials, and documentation to help users prepare and succeed.
7. Support is available for technical issues, account management, and navigating the interview process.

Your goal is to provide accurate information, assist with common inquiries, and ensure a positive experience for all Headstarter users.
`;

export async function POST(req) {
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
  const data = await req.json()

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...data,
    ],
    model: 'gpt-4o-mini',
    stream: true
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try{
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            const text = encoder.encode(content)
            controller.enqueue(text)
          }
        }
      }
      catch(err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })
  return new NextResponse(stream)
}