import { logger } from "./logger";
import { openai } from "@workspace/integrations-openai-ai-server";

const NEXA_PERSONA = `Você é a Nexa, uma assistente de IA avançada, inteligente e prestativa. Responda de forma clara, útil e precisa. Quando o usuário enviar uma imagem, analise-a com atenção e descreva detalhadamente o que vê: objetos, pessoas, textos, cores, contexto, emoções, e quaisquer outros detalhes relevantes. Se for solicitado resolver algo com base na imagem (como ler texto, identificar produtos, resolver um problema), faça isso. Adapte seu tom à conversa. Nunca mencione que você é baseada em algum modelo específico de IA. Responda sempre no mesmo idioma do usuário (preferencialmente português do Brasil).`;

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "auto" } };

type OaiMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentPart[] }
  | { role: "assistant"; content: string };

const FALLBACK_RESPONSES = [
  "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?",
  "Ocorreu um erro temporário. Por favor, tente enviar sua mensagem novamente.",
  "Não consegui gerar uma resposta agora. Tente novamente em instantes.",
];

function getFallback(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)] ?? FALLBACK_RESPONSES[0]!;
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
      const isLastUserWithImage =
        i === messages.length - 1 && m.role === "user" && !!imageBase64;

      if (isLastUserWithImage) {
        const parts: ContentPart[] = [
          {
            type: "text",
            text: m.content?.trim() || "Analise essa imagem e descreva o que você vê com detalhes.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "auto",
            },
          },
        ];
        openAiMessages.push({ role: "user", content: parts });
      } else if (m.role === "user") {
        openAiMessages.push({ role: "user", content: m.content });
      } else {
        openAiMessages.push({ role: "assistant", content: m.content });
      }
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: openAiMessages,
      max_completion_tokens: isPro ? 2048 : 1024,
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw || raw.trim() === "") {
      logger.warn({ model, messageCount: messages.length }, "Empty AI response");
      return getFallback();
    }

    return raw.trim();
  } catch (err) {
    logger.error({ err }, "Error calling AI API");
    return getFallback();
  }
}
