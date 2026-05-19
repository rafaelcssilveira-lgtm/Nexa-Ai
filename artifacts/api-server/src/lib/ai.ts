import { logger } from "./logger";

const NEXA_PERSONA = `You are Nexa, an advanced AI assistant. You are intelligent, helpful, concise, and precise. You provide high-quality responses that are clear and actionable. You adapt your tone to the conversation — technical when needed, warm and human when appropriate. When the user sends an image, describe and analyze it thoroughly. Never mention that you are based on any specific AI model. Respond in the same language as the user.`;

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

type OpenAiContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "auto" } }
    >;

interface OpenAiMessage {
  role: "system" | "user" | "assistant";
  content: OpenAiContent;
}

export async function generateAiResponse(
  messages: AiMessage[],
  isPro: boolean,
  imageBase64?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateFallbackResponse(messages, isPro, !!imageBase64);
  }

  try {
    const openAiMessages: OpenAiMessage[] = [
      { role: "system", content: NEXA_PERSONA },
    ];

    messages.forEach((m, i) => {
      const isLastUser = i === messages.length - 1 && m.role === "user" && imageBase64;
      if (isLastUser) {
        openAiMessages.push({
          role: "user",
          content: [
            { type: "text", text: m.content || "O que há nessa imagem?" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "auto",
              },
            },
          ],
        });
      } else {
        openAiMessages.push({ role: m.role, content: m.content });
      }
    });

    const model = imageBase64 ? "gpt-4o" : isPro ? "gpt-4o" : "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openAiMessages,
        max_tokens: isPro ? 2000 : 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ status: response.status, err }, "OpenAI API error");
      return generateFallbackResponse(messages, isPro, !!imageBase64);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return (
      data.choices[0]?.message?.content ??
      "Não consegui gerar uma resposta. Por favor, tente novamente."
    );
  } catch (err) {
    logger.error({ err }, "Error calling OpenAI API");
    return generateFallbackResponse(messages, isPro, !!imageBase64);
  }
}

function generateFallbackResponse(
  messages: AiMessage[],
  isPro: boolean,
  hasImage: boolean
): string {
  if (hasImage) {
    return `Recebi sua imagem! ${isPro ? "Como usuário PRO, posso analisar imagens com detalhes completos. " : ""}Para uma análise detalhada da imagem, configure a chave OPENAI_API_KEY. Por enquanto, posso responder suas perguntas sobre ela.`;
  }

  const lastMessage = messages[messages.length - 1]?.content ?? "";
  const lowerMsg = lastMessage.toLowerCase();

  if (lowerMsg.includes("oi") || lowerMsg.includes("olá") || lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
    return `Olá! Sou a Nexa${isPro ? " PRO" : ""}, sua assistente de IA. Como posso ajudar você hoje?`;
  }

  if (lowerMsg.includes("como você está") || lowerMsg.includes("how are you")) {
    return "Estou operacional e pronta para ajudar! O que posso fazer por você?";
  }

  if (lowerMsg.includes("?")) {
    return `Boa pergunta! ${isPro ? "Com acesso PRO, tenho capacidade de raciocínio completa. " : ""}Para respostas mais precisas, configure a chave OPENAI_API_KEY. Posso tentar ajudar com o contexto que tenho — pode me dar mais detalhes?`;
  }

  if (lowerMsg.includes("código") || lowerMsg.includes("code") || lowerMsg.includes("programa")) {
    return `Posso ajudar com isso${isPro ? " — como usuário PRO, tenho acesso a exemplos mais detalhados" : ""}! Compartilhe o código ou descreva o problema específico.`;
  }

  const responses = [
    `Entendi! ${isPro ? "Como usuário PRO, posso aprofundar mais neste assunto. " : ""}Para respostas mais completas, configure a OPENAI_API_KEY. O que mais posso esclarecer?`,
    `Interessante! ${isPro ? "Seu acesso PRO permite análises mais detalhadas. " : ""}Posso explorar mais este tema. Qual aspecto é mais importante para você?`,
    `Processado! ${isPro ? "PRO users têm acesso às minhas capacidades completas. " : ""}Para melhores resultados, adicione a OPENAI_API_KEY. Como posso ajudar mais?`,
  ];

  return responses[Math.floor(Math.random() * responses.length)] ?? responses[0]!;
}
