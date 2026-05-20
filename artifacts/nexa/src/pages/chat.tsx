import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { flushSync } from "react-dom";
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
import { MessageSquare, Send, Loader2, Trash2, Menu, ImageIcon, X, ZoomIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@workspace/api-client-react";

type LocalMessage = Message & { imageUrl?: string | null };

type CachedConversation = {
  id: number;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

// Typewriter effect component
const TypewriterText = memo(function TypewriterText({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!text) return;
    let i = 0;
    // Adaptive speed: aim to finish in ~2.5s, min 4ms, max 18ms per char
    const speed = Math.max(4, Math.min(18, Math.floor(2500 / text.length)));
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);

  const done = displayed.length >= text.length;
  return (
    <>
      {displayed}
      {!done && (
        <span className="inline-block w-[2px] h-[14px] bg-primary/60 ml-0.5 align-middle animate-pulse rounded-sm" />
      )}
    </>
  );
});

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
  "Digite algo...",
];

function ChatArea({ conversationId }: { conversationId?: number }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openSidebar } = useSidebarToggle();

  const [inputValue, setInputValue] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; base64: string } | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * placeholders.length));

  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createConvMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();
  const deleteConvMutation = useDeleteConversation();

  // isSending covers the mutation states; isProcessing covers the full flow including gaps between mutations
  const isSending = isProcessing || createConvMutation.isPending || sendMessageMutation.isPending;
  const isSendingRef = useRef(isSending);
  isSendingRef.current = isSending;

  const { data: serverMessages, isLoading: isLoadingMessages } = useListMessages(
    conversationId || 0,
    { query: { enabled: !!conversationId, queryKey: getListMessagesQueryKey(conversationId || 0) } }
  );

  // Sync server → local only when NOT sending (avoids flash)
  useEffect(() => {
    if (isSendingRef.current) return;
    if (serverMessages) {
      setLocalMessages(serverMessages as LocalMessage[]);
      setTypingMessageId(null);
    } else if (!conversationId) {
      setLocalMessages([]);
    }
  }, [serverMessages, conversationId]);

  // Reset typing when conversation changes
  useEffect(() => {
    setTypingMessageId(null);
  }, [conversationId]);

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
  }, [localMessages.length, isSending]);

  // Conversation title from React Query cache
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

    // Mark the whole operation as in-progress so the thinking indicator
    // stays visible even between the two sequential mutations
    setIsProcessing(true);

    let currentConvId = conversationId;
    // Declared here so the catch block can remove the optimistic message on error
    let tempId = -1;

    try {
      if (!currentConvId) {
        const newConv = await createConvMutation.mutateAsync({
          data: { title: content.substring(0, 45) + (content.length > 45 ? "..." : "") },
        });
        currentConvId = newConv.id;
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        // NOTE: do NOT call setLocation yet — we add the optimistic message first
        // so that when the URL changes and the component re-renders, localMessages
        // is already non-empty and the loading spinner (black screen) is suppressed.
      }

      if (!currentConvId) return;

      // ✅ Add optimistic message using flushSync so React commits the DOM update
      // BEFORE setLocation fires. Wouter uses the browser History API directly
      // (outside React's batch), so without flushSync the component would
      // re-render with the new conversationId but localMessages still empty →
      // isLoadingMessages && localMessages.length === 0 → black screen.
      tempId = Date.now();
      const optimistic: LocalMessage = {
        id: tempId,
        conversationId: currentConvId,
        role: "user",
        content,
        imageUrl: imageDataUrl ?? null,
        createdAt: new Date().toISOString(),
      };
      flushSync(() => {
        setLocalMessages((prev) => [...prev, optimistic]);
      });

      // ✅ Navigate only AFTER the DOM has the optimistic message committed
      if (!conversationId) {
        setLocation(`/chat/${currentConvId}`, { replace: true });
      }

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

      queryClient.setQueryData(getGetMeQueryKey(), (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...(old as object), dailyMessagesUsed: response.dailyMessagesUsed };
      });
    } catch (e: unknown) {
      // Keep the optimistic message visible so the screen doesn't go blank.
      // Removing it from a new conversation (where it was the only message)
      // would cause localMessages=[] and show the empty state ("outra tela").
      // The user can retry by sending again.
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
      handleSend();
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

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

      <div className="flex-1 flex flex-col h-full bg-background">
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

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-6">
          {isLoadingMessages && localMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-xs">Carregando...</span>
              </div>
            </div>
          ) : localMessages.length === 0 ? (
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
                <h2 className="text-xl font-bold">Como posso ajudar?</h2>
                <p className="text-sm text-muted-foreground/60 leading-relaxed">
                  Faça uma pergunta, envie um texto ou uma imagem.<br />A Nexa está pronta para você.
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              <AnimatePresence initial={false}>
                {localMessages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0 mr-2.5 mt-1 self-start shadow-sm">
                        <MessageSquare size={12} className="text-primary" strokeWidth={2} />
                      </div>
                    )}
                    <div
                      className={`max-w-[84%] sm:max-w-[76%] ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md shadow-lg shadow-primary/15"
                          : "bg-card border border-white/[0.07] text-card-foreground rounded-2xl rounded-tl-md shadow-md"
                      } px-4 py-3`}
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

                      {/* Nexa label */}
                      {msg.role === "assistant" && (
                        <div className="text-[10px] font-semibold text-primary/50 tracking-[0.15em] uppercase mb-1.5">
                          Nexa
                        </div>
                      )}

                      {/* Content */}
                      <div className="text-[13px] leading-[1.65] whitespace-pre-wrap">
                        {msg.role === "assistant" && typingMessageId === msg.id ? (
                          <TypewriterText
                            text={msg.content || ""}
                            onComplete={() => {
                              setTypingMessageId(null);
                              scrollToBottom(true);
                            }}
                          />
                        ) : (
                          msg.content || "..."
                        )}
                      </div>
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
                    className="flex justify-start"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0 mr-2.5 mt-1 self-start shadow-sm">
                      <MessageSquare size={12} className="text-primary" strokeWidth={2} />
                    </div>
                    <div className="bg-card border border-white/[0.07] rounded-2xl rounded-tl-md px-4 py-3 shadow-md">
                      <div className="text-[10px] font-semibold text-primary/50 tracking-[0.15em] uppercase mb-2">
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
              {/* Glow border */}
              <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-violet-500/15 to-blue-500/20 rounded-[18px] blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-400 pointer-events-none" />

              <div className="relative bg-card border border-white/[0.09] rounded-[17px] shadow-xl focus-within:border-primary/30 transition-colors duration-200">
                {/* Image preview */}
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
                    onClick={handleSend}
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
