import { logger } from "./logger";

const NEXA_PERSONA = `You are Nexa, an advanced AI assistant. You are intelligent, helpful, concise, and precise. You provide high-quality responses that are clear and actionable. You adapt your tone to the conversation — technical when needed, warm and human when appropriate. Never mention that you are based on any specific AI model.`;

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateAiResponse(
  messages: AiMessage[],
  isPro: boolean
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateFallbackResponse(messages, isPro);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: isPro ? "gpt-4o" : "gpt-4o-mini",
        messages: [
          { role: "system", content: NEXA_PERSONA },
          ...messages,
        ],
        max_tokens: isPro ? 2000 : 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ status: response.status, err }, "OpenAI API error");
      return generateFallbackResponse(messages, isPro);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";
  } catch (err) {
    logger.error({ err }, "Error calling OpenAI API");
    return generateFallbackResponse(messages, isPro);
  }
}

function generateFallbackResponse(messages: AiMessage[], isPro: boolean): string {
  const lastMessage = messages[messages.length - 1]?.content ?? "";
  const lowerMsg = lastMessage.toLowerCase();

  if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("oi") || lowerMsg.includes("olá")) {
    return `Hello! I'm Nexa${isPro ? " (PRO)" : ""}, your AI assistant. How can I help you today?`;
  }

  if (lowerMsg.includes("how are you") || lowerMsg.includes("como você está")) {
    return "I'm fully operational and ready to help. What can I do for you?";
  }

  if (lowerMsg.includes("?")) {
    return `That's an excellent question. ${isPro ? "As a PRO user, you have access to my full reasoning capabilities. " : ""}To give you the most accurate answer, I'd need to analyze this carefully. Could you provide more context so I can give you the best possible response?`;
  }

  if (lowerMsg.includes("code") || lowerMsg.includes("function") || lowerMsg.includes("programming")) {
    return `I can help with that${isPro ? " — as a PRO user, I can provide more detailed technical explanations and code examples" : ""}. Could you share the specific code or problem you're working with?`;
  }

  const responses = [
    `I understand what you're saying. ${isPro ? "With your PRO access, I can dive deeper into this topic. " : ""}Let me help you with that. What specific aspect would you like to explore further?`,
    `Great point. ${isPro ? "PRO users get priority, more detailed responses from me. " : ""}I'd be happy to help. Can you give me a bit more detail about what you need?`,
    `I've processed your message. ${isPro ? "As a PRO user, I can provide extended context and analysis. " : ""}To give you the most helpful response, could you clarify what outcome you're looking for?`,
    `Interesting. ${isPro ? "Your PRO subscription gives you access to my full capabilities. " : ""}I'd love to help you with this. What would be the most useful way I can assist?`,
  ];

  return responses[Math.floor(Math.random() * responses.length)] ?? responses[0]!;
}
