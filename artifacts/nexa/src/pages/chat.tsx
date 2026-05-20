import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout, useSidebarToggle } from "@/components/layout/AppLayout";
import {
  useListMessages,
  getListMessagesQueryKey,
  useSendMessage,
  useCreateConversation,
  useDeleteConversation,
  getGetMeQueryKey,
  getListConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Loader2, Trash2, Menu, ImageIcon, X, ZoomIn, Copy, Check as CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type LocalMessage = Message & { imageUrl?: string | null };

type CachedConversation = {
  id: number;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-[10px] text-muted-foreground/70 hover:text-foreground transition-all"
    >
      {copied ? <CheckIcon size={10} /> : <Copy size={10} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1.5 mt-3 first:mt-0 text-foreground/90">{children}</h3>,
        ul: ({ children }) => <ul className="mb-3 space-y-1.5 list-none pl-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 space-y-1.5 list-decimal pl-5">{children}</ol>,
        li: ({ children }) => (
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
            <span>{children}</span>
          </li>
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          const codeText = String(children).replace(/\n$/, "");
          if (isBlock) {
            const lang = className?.replace("language-", "") ?? "";
            return (
              <div className="relative my-3 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0d0d10]">
                {lang && (
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07] bg-white/[0.03]">
                    <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">{lang}</span>
                    <CopyButton text={codeText} />
                  </div>
                )}
                {!lang && <CopyButton text={codeText} />}
                <pre className="overflow-x-auto px-4 py-3.5 text-[12.5px] leading-relaxed font-mono text-foreground/85">
                  <code>{codeText}</code>
                </pre>
              </div>
            );
          }
          return (
            <code
              className="px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.08] text-[12px] font-mono text-primary/90"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/40 pl-3 my-3 text-muted-foreground/80 italic">{children}</blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-4 border-white/[0.08]" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 border border-white/[0.08] bg-white/[0.04] font-semibold text-foreground/90 text-xs uppercase tracking-wide">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border border-white/[0.06] text-foreground/80">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

// ─── TypewriterMarkdown ───────────────────────────────────────────────────────

const TypewriterMarkdown = memo(function TypewriterMarkdown({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const speed = Math.max(3, Math.min(14, Math.floor(2200 / text.length)));
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
        onCompleteRef.current?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);

  if (done) {
    return <MarkdownContent content={text} />;
  }

  return (
    <span className="whitespace-pre-wrap text-[13px] leading-[1.7]">
      {displayed}
      <span className="inline-block w-[2px] h-[14px] bg-primary/60 ml-0.5 align-middle animate-pulse rounded-sm" />
    </span>
  );
});

// ─── ChatPage ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { id } = useParams();
  const convId = id ? parseInt(id, 10) : undefined;

  return (
    <AppLayout>
      <ChatArea conversationId={convId} />
    </AppLayout>
  );
}

const placeholders = [
  "Mensagem para a Nexa...",
  "Faça uma pergunta...",
  "O que você quer saber?",
  "Descreva seu problema...",
  "Como posso ajudar você hoje?",
];

// ─── ChatArea ─────────────────────────────────────────────────────────────────

function ChatArea({ conversationId }: { conversationId?: number }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openSidebar } = useSidebarToggle();

  const [inputValue, setInputValue] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; base64: string } | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // After handleSend completes, set this to navigate to the new conversation.
  // The useEffect below waits for isSending=false to guarantee all state is
  // settled before changing the URL — this eliminates the race condition that
  // caused the blank screen.
  const [pendingNavId, setPendingNavId] = useState<number | null>(null);
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * placeholders.length));

  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Set to true immediately before setLocation inside the pendingNavId effect
  // so that Effect 1 knows this conversationId change came from a send — not
  // from the user clicking a different conversation — and skips clearing messages.
  const navigatingAfterSendRef = useRef(false);

  const createConvMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();
  const deleteConvMutation = useDeleteConversation();

  const isSending = isProcessing || createConvMutation.isPending || sendMessageMutation.isPending;
  const isSendingRef = useRef(isSending);
  isSendingRef.current = isSending;

  const { data: serverMessages, isLoading: isLoadingMessages } = useListMessages(
    conversationId || 0,
    { query: { enabled: !!conversationId, queryKey: getListMessagesQueryKey(conversationId || 0) } }
  );

  // Effect 1: clear local optimistic messages when the user navigates to a
  // different conversation. Skip when the change was caused by a send.
  useEffect(() => {
    if (navigatingAfterSendRef.current) {
      navigatingAfterSendRef.current = false;
      return;
    }
    setLocalMessages([]);
    setTypingMessageId(null);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: navigate to a new conversation AFTER all state has settled.
  // pendingNavId is set inside handleSend; isSending drops to false in finally.
  // Both are batched → this effect fires with isSending=false already set.
  useEffect(() => {
    if (pendingNavId === null || isSending) return;
    navigatingAfterSendRef.current = true;
    setLocation(`/chat/${pendingNavId}`, { replace: true });
    setPendingNavId(null);
  }, [pendingNavId, isSending, setLocation]);

  // Merged display: prefer server data when available, append local-only
  // optimistic messages (IDs not yet in the server response).
  const displayMessages = useMemo((): LocalMessage[] => {
    if (serverMessages && serverMessages.length > 0) {
      const serverIds = new Set(serverMessages.map((m) => m.id));
      const localOnly = localMessages.filter((m) => !serverIds.has(m.id));
      if (localOnly.length === 0) return serverMessages as LocalMessage[];
      return [...(serverMessages as LocalMessage[]), ...localOnly];
    }
    return localMessages;
  }, [serverMessages, localMessages]);

  const scrollToBottom = useCallback((smooth = false) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages.length, isSending, scrollToBottom]);

  const cachedConversations = queryClient.getQueryData<CachedConversation[]>(getListConversationsQueryKey());
  const conversationTitle = conversationId
    ? cachedConversations?.find((c) => c.id === conversationId)?.title
    : undefined;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "O máximo é 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      setPendingImage({ dataUrl, base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    const content = inputValue.trim() || (pendingImage ? "O que há nessa imagem?" : "");
    if (!content && !pendingImage) return;

    const imageBase64 = pendingImage?.base64;
    const imageDataUrl = pendingImage?.dataUrl;

    setInputValue("");
    setPendingImage(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setIsProcessing(true);

    let currentConvId = conversationId;
    const isNewConversation = !conversationId;
    let tempId = -1;

    try {
      if (!currentConvId) {
        const newConv = await createConvMutation.mutateAsync({
          data: { title: content.substring(0, 45) + (content.length > 45 ? "..." : "") },
        });
        currentConvId = newConv.id;
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      }

      if (!currentConvId) return;

      // Add optimistic message immediately — visible while waiting for AI.
      // For new conversations we're still at /chat so useListMessages is
      // disabled and cannot overwrite localMessages.
      tempId = Date.now();
      const optimistic: LocalMessage = {
        id: tempId,
        conversationId: currentConvId,
        role: "user",
        content,
        imageUrl: imageDataUrl ?? null,
        createdAt: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, optimistic]);

      const response = await sendMessageMutation.mutateAsync({
        id: currentConvId,
        data: { content, imageBase64: imageBase64 ?? null },
      });

      const assistantId = (response.assistantMessage as LocalMessage).id;

      setLocalMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        response.userMessage as LocalMessage,
        response.assistantMessage as LocalMessage,
      ]);
      setTypingMessageId(assistantId);

      // Safely invalidate (not setQueryData) so dailyMessagesUsed refreshes
      // in the background without any risk of corrupting the auth cache.
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });

      if (isNewConversation) {
        // Pre-populate the messages cache so useListMessages finds data
        // immediately when it enables after the URL change.
        queryClient.setQueryData(
          getListMessagesQueryKey(currentConvId),
          [response.userMessage, response.assistantMessage],
        );
        // Signal navigation via state — Effect 2 fires after isSending=false,
        // guaranteeing all state is committed before the URL changes.
        setPendingNavId(currentConvId);
      }
    } catch (e: unknown) {
      if (tempId !== -1) {
        setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
      const err = e as { data?: { error?: string }; error?: string };
      const msg = err.data?.error || err.error;
      toast({
        title: "Falha ao enviar",
        description: msg || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    if (!conversationId) return;
    deleteConvMutation.mutate({ id: conversationId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setLocation("/chat");
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const firstName = user?.name?.split(" ")[0];

  return (
    <>
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-md"
            onClick={() => setLightboxSrc(null)}
          >
            <motion.img
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              src={lightboxSrc}
              alt="Imagem ampliada"
              className="max-w-[92vw] max-h-[88vh] rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
              onClick={() => setLightboxSrc(null)}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/[0.05] bg-background/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={openSidebar}
              aria-label="Abrir menu"
            >
              <Menu size={17} />
            </Button>
            {conversationTitle ? (
              <span className="text-[13px] text-muted-foreground/70 font-medium truncate">
                {conversationTitle}
              </span>
            ) : (
              <span className="text-[13px] text-muted-foreground/40 font-medium">Nova conversa</span>
            )}
          </div>
          {conversationId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={handleDelete}
              disabled={deleteConvMutation.isPending}
              data-testid="button-delete-conversation"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-6 overscroll-contain">
          {isLoadingMessages && displayMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-xs">Carregando...</span>
              </div>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5 max-w-sm mx-auto px-4">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-2xl shadow-primary/10"
              >
                <MessageSquare size={26} strokeWidth={1.5} />
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="space-y-2"
              >
                <h2 className="text-xl font-bold">
                  {firstName ? `Olá, ${firstName}` : "Como posso ajudar?"}
                </h2>
                <p className="text-sm text-muted-foreground/60 leading-relaxed">
                  Faça uma pergunta, envie um texto ou uma imagem.<br />A Nexa está pronta para você.
                </p>
              </motion.div>
              {/* Quick prompts */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-wrap justify-center gap-2 mt-1"
              >
                {["Explique um conceito", "Escreva um texto", "Analise um problema", "Crie uma ideia"].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInputValue(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/[0.09] bg-white/[0.03] text-muted-foreground/60 hover:text-foreground hover:border-white/20 hover:bg-white/[0.06] transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="space-y-5 max-w-3xl mx-auto pb-2">
              <AnimatePresence initial={false}>
                {displayMessages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2.5`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 self-start shadow-sm">
                        <MessageSquare size={12} className="text-primary" strokeWidth={2} />
                      </div>
                    )}
                    <div
                      className={`min-w-0 ${
                        msg.role === "user"
                          ? "max-w-[82%] sm:max-w-[74%] bg-primary text-primary-foreground rounded-2xl rounded-tr-md shadow-lg shadow-primary/15 px-4 py-3"
                          : "max-w-[88%] sm:max-w-[82%] bg-card border border-white/[0.07] text-card-foreground rounded-2xl rounded-tl-md shadow-md px-4 py-3.5"
                      }`}
                      data-testid={`message-${msg.role}-${idx}`}
                    >
                      {/* Image */}
                      {msg.imageUrl && (
                        <div className="mb-3 relative group/img">
                          <img
                            src={msg.imageUrl}
                            alt="Imagem enviada"
                            className="rounded-xl max-h-64 max-w-full w-auto object-contain border border-white/10 cursor-zoom-in transition-opacity hover:opacity-90"
                            onClick={() => setLightboxSrc(msg.imageUrl!)}
                          />
                          <button
                            onClick={() => setLightboxSrc(msg.imageUrl!)}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/60 border border-white/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <ZoomIn size={12} className="text-white" />
                          </button>
                        </div>
                      )}

                      {msg.role === "assistant" && (
                        <div className="text-[10px] font-semibold text-primary/50 tracking-[0.15em] uppercase mb-2">
                          Nexa
                        </div>
                      )}

                      {/* Content */}
                      {msg.role === "assistant" ? (
                        <div className="text-[13px] leading-[1.7] prose-invert">
                          {typingMessageId === msg.id ? (
                            <TypewriterMarkdown
                              text={msg.content || ""}
                              onComplete={() => {
                                setTypingMessageId(null);
                                scrollToBottom(true);
                              }}
                            />
                          ) : (
                            <MarkdownContent content={msg.content || ""} />
                          )}
                        </div>
                      ) : (
                        <div className="text-[13px] leading-[1.65] whitespace-pre-wrap">
                          {msg.content || "..."}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Thinking indicator */}
                {isSending && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-start gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 self-start shadow-sm">
                      <MessageSquare size={12} className="text-primary" strokeWidth={2} />
                    </div>
                    <div className="bg-card border border-white/[0.07] rounded-2xl rounded-tl-md px-4 py-3.5 shadow-md">
                      <div className="text-[10px] font-semibold text-primary/50 tracking-[0.15em] uppercase mb-2.5">
                        Nexa
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
                            style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.9s" }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-3 sm:px-5 md:px-8 py-3 md:py-4 bg-background shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-violet-500/15 to-blue-500/20 rounded-[18px] blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-400 pointer-events-none" />
              <div className="relative bg-card border border-white/[0.09] rounded-[17px] shadow-xl focus-within:border-primary/30 transition-colors duration-200">
                {pendingImage && (
                  <div className="px-3 pt-3">
                    <div className="relative inline-block">
                      <img
                        src={pendingImage.dataUrl}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-xl border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setPendingImage(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-white/20 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-1 p-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.05] rounded-xl"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isSending}
                    title="Enviar imagem"
                  >
                    <ImageIcon size={16} />
                  </Button>

                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      autoResize(e.target);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={pendingImage ? "Pergunte sobre a imagem..." : placeholders[placeholderIdx]}
                    className="flex-1 bg-transparent border-0 focus:ring-0 resize-none px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/35 outline-none min-h-[40px] max-h-40 leading-relaxed"
                    rows={1}
                    data-testid="input-chat"
                    disabled={isSending}
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                  />

                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
                    onClick={() => void handleSend()}
                    disabled={(!inputValue.trim() && !pendingImage) || isSending}
                    data-testid="button-send-chat"
                  >
                    {isSending ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : (
                      <Send size={15} />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-center mt-2 text-[10px] text-muted-foreground/25">
              A Nexa pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
