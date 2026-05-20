import { logger } from "./logger";
import { openai } from "@workspace/integrations-openai-ai-server";

// ─── Personas ────────────────────────────────────────────────────────────────

const BASE_PERSONA = `Você é a Nexa, uma assistente de IA extremamente avançada, inteligente e útil.

Capacidades:
- Responde qualquer pergunta com profundidade e precisão
- Analisa imagens com riqueza de detalhes (objetos, textos, pessoas, contexto, emoções)
- Acessa informações atuais da internet e traz links reais de notícias
- Resolve problemas complexos: código, matemática, redação, análise, criação
- Adapta o tom à conversa (formal, casual, técnico, criativo)

Regras:
- Responda SEMPRE em português do Brasil, a não ser que o usuário escreva em outro idioma
- Nunca revele qual modelo de IA você usa internamente
- Quando tiver notícias/links disponíveis no contexto, INCLUA-OS na resposta usando formato Markdown: [Título do artigo](URL)
- Seja direto, objetivo e genuinamente útil — sem enrolação
- Use Markdown para estruturar respostas mais longas (listas, negrito, títulos)
- Se não souber algo com certeza, diga claramente em vez de inventar`;

const PRO_EXTRA = `

Contexto especial — usuário PRO:
- Este usuário tem prioridade máxima e acesso completo
- Forneça respostas mais completas, aprofundadas e detalhadas
- Sempre inclua links de notícias quando relevante
- Análise de imagens com o máximo de detalhe possível
- Explique raciocínios complexos passo a passo quando útil`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "high" | "auto" } };

type OaiMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentPart[] }
  | { role: "assistant"; content: string };

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const FALLBACK_RESPONSES = [
  "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?",
  "Ocorreu um erro temporário. Por favor, tente enviar sua mensagem novamente.",
  "Não consegui gerar uma resposta agora. Tente novamente em instantes.",
];

function getFallback(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)] ?? FALLBACK_RESPONSES[0]!;
}

// ─── Search intent detection ──────────────────────────────────────────────────

const SEARCH_KEYWORDS = [
  "notícia", "notícias", "news", "hoje", "agora", "atual", "atualidade",
  "última hora", "acontecimento", "recente", "semana", "esse mês", "este ano",
  "clima", "tempo", "previsão", "temperatura", "preço", "cotação", "dólar",
  "euro", "bitcoin", "resultado", "jogo", "placar", "campeonato", "eleição",
  "político", "governo", "presidente", "lançamento", "estreou", "novo",
  "quem é", "o que é", "como está", "o que aconteceu", "me fale sobre",
  "pesquise", "busque", "procure", "encontre informações", "descubra",
];

function shouldSearch(message: string, isPro: boolean): boolean {
  const lower = message.toLowerCase();
  if (isPro) {
    // PRO: pesquisa sempre que a mensagem parecer precisar de info atual
    const hasQuestion = lower.includes("?") || lower.startsWith("o que") ||
      lower.startsWith("quem") || lower.startsWith("qual") ||
      lower.startsWith("como") || lower.startsWith("quando") ||
      lower.startsWith("onde") || lower.startsWith("por que");
    if (hasQuestion && lower.length > 20) return true;
  }
  return SEARCH_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractSearchQuery(message: string): string {
  // Remove common filler phrases to get a cleaner search query
  return message
    .replace(/^(me fale sobre|pesquise sobre|busque|procure|encontre informações sobre|me diga sobre)\s*/i, "")
    .replace(/\?/g, "")
    .trim()
    .substring(0, 120);
}

// ─── Google News RSS ──────────────────────────────────────────────────────────

async function fetchGoogleNews(query: string, maxResults: number): Promise<NewsItem[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NexaBot/1.0)" },
  });

  if (!res.ok) return [];

  const xml = await res.text();
  const rawItems = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

  return rawItems
    .slice(0, maxResults)
    .map((item) => {
      const cdataTitle = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1];
      const plainTitle = item.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const rawTitle = (cdataTitle ?? plainTitle ?? "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();

      // In Google News RSS, <link> appears between </title> and <guid>
      const linkMatch = item.match(/<link>(https?:\/\/[^\s<]+)<\/link>/);
      const link = linkMatch?.[1]?.trim() ?? "";

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() ?? "";

      const cdataSource = item.match(/<source[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/source>/)?.[1];
      const plainSource = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1];
      const source = (cdataSource ?? plainSource ?? "").trim();

      return { title: rawTitle, link, pubDate, source };
    })
    .filter((n) => n.title && n.link);
}

function buildNewsContext(news: NewsItem[]): string {
  if (!news.length) return "";
  const lines = news.map((n, i) => {
    const date = n.pubDate ? ` (${n.pubDate})` : "";
    const src = n.source ? ` — ${n.source}` : "";
    return `${i + 1}. [${n.title}](${n.link})${src}${date}`;
  });
  return `\n\n---\nNotícias recentes encontradas na internet:\n${lines.join("\n")}\n\nUse essas notícias na sua resposta incluindo os links no formato Markdown quando relevante.\n---`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateAiResponse(
  messages: AiMessage[],
  isPro: boolean,
  imageBase64?: string
): Promise<string> {
  try {
    const model = isPro ? "gpt-4o" : "gpt-4o-mini";
    const maxTokens = isPro ? 3000 : 1200;
    const newsCount = isPro ? 7 : 4;

    // Build system prompt
    let systemPrompt = BASE_PERSONA + (isPro ? PRO_EXTRA : "");

    // Detect if we should search for news
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage && shouldSearch(lastUserMessage.content, isPro)) {
      try {
        const query = extractSearchQuery(lastUserMessage.content);
        const news = await fetchGoogleNews(query, newsCount);
        if (news.length > 0) {
          systemPrompt += buildNewsContext(news);
          logger.info({ query, count: news.length }, "Google News fetched");
        }
      } catch (searchErr) {
        logger.warn({ searchErr }, "Google News fetch failed — continuing without search");
      }
    }

    // Build messages array
    const oaiMessages: OaiMessage[] = [{ role: "system", content: systemPrompt }];

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i]!;
      const isLastUser = i === messages.length - 1 && m.role === "user";

      if (isLastUser && imageBase64) {
        const parts: ContentPart[] = [
          {
            type: "text",
            text: m.content?.trim() || "Analise essa imagem e descreva com detalhes tudo que você vê.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: isPro ? "high" : "auto",
            },
          },
        ];
        oaiMessages.push({ role: "user", content: parts });
      } else if (m.role === "user") {
        oaiMessages.push({ role: "user", content: m.content });
      } else {
        oaiMessages.push({ role: "assistant", content: m.content });
      }
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: oaiMessages,
      max_completion_tokens: maxTokens,
      temperature: isPro ? 0.7 : 0.8,
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
