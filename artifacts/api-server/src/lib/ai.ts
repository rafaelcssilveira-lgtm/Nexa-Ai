import { logger } from "./logger";
import { openai } from "@workspace/integrations-openai-ai-server";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "auto" } };

type OaiMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentPart[] }
  | { role: "assistant"; content: string };

const NEXA_PERSONA = `Você é a Nexa, uma assistente de IA avançada e inteligente. Você é prestativa, concisa e precisa. Quando o usuário enviar uma imagem, descreva e analise-a com detalhes — cores, objetos, pessoas, texto visível, contexto, etc. Adapte seu tom à conversa: técnico quando necessário, amigável quando apropriado. Nunca mencione que você é baseada em algum modelo específico de IA. Responda sempre no mesmo idioma do usuário.`;

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateAiResponse(
  messages: AiMessage[],
  isPro: boolean,
  imageBase64?: string
): Promise<string> {
  try {
    const model = isPro ? "gpt-5.4" : "gpt-5-mini";

    const openAiMessages: OaiMessage[] = [
      { role: "system", content: NEXA_PERSONA },
    ];

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i]!;
      const isLastUser = i === messages.length - 1 && m.role === "user" && !!imageBase64;

      if (isLastUser) {
        const content: ContentPart[] = [
          { type: "text", text: m.content || "O que há nessa imagem?" },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "auto",
            },
          },
        ];
        openAiMessages.push({ role: "user", content });
      } else if (m.role === "user") {
        openAiMessages.push({ role: "user", content: m.content });
      } else {
        openAiMessages.push({ role: "assistant", content: m.content });
      }
    }

    const response = await openai.chat.completions.create({
      model,
      messages: openAiMessages,
      max_completion_tokens: isPro ? 2000 : 800,
    });

    return (
      response.choices[0]?.message?.content ??
      "Não consegui gerar uma resposta. Por favor, tente novamente."
    );
  } catch (err) {
    logger.error({ err }, "Error calling AI API");
    return generateFallbackResponse(messages, isPro, !!imageBase64);
  }
}

function generateFallbackResponse(
  messages: AiMessage[],
  isPro: boolean,
  hasImage: boolean
): string {
  if (hasImage) {
    return `Recebi sua imagem! Porém estou com um problema temporário no serviço de visão. Tente novamente em instantes.`;
  }

  const lastMessage = messages[messages.length - 1]?.content ?? "";
  const lowerMsg = lastMessage.toLowerCase();

  if (lowerMsg.includes("oi") || lowerMsg.includes("olá") || lowerMsg.includes("hello")) {
    return `Olá! Sou a Nexa${isPro ? " PRO" : ""}, sua assistente de IA. Como posso ajudar?`;
  }

  const responses = [
    "Entendido! Estou processando sua mensagem. Como posso ajudar melhor?",
    "Interessante! Pode me dar mais detalhes para eu te ajudar da melhor forma?",
    "Certo! Vou fazer o possível para te ajudar. O que mais você precisa?",
  ];

  return responses[Math.floor(Math.random() * responses.length)] ?? responses[0]!;
}
