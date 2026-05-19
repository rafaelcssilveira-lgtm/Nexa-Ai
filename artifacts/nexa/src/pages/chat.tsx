import React, { useState, useEffect, useRef } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, Trash2, Menu, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@workspace/api-client-react";

type LocalMessage = Message & { imageUrl?: string | null };

export default function ChatPage() {
  const { id } = useParams();
  const convId = id ? parseInt(id, 10) : undefined;

  return (
    <AppLayout>
      <ChatArea conversationId={convId} />
    </AppLayout>
  );
}

function ChatArea({ conversationId }: { conversationId?: number }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openSidebar } = useSidebarToggle();

  const [inputValue, setInputValue] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; base64: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: serverMessages, isLoading: isLoadingMessages } = useListMessages(
    conversationId || 0,
    { query: { enabled: !!conversationId, queryKey: getListMessagesQueryKey(conversationId || 0) } }
  );

  useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages as LocalMessage[]);
    } else if (!conversationId) {
      setLocalMessages([]);
    }
  }, [serverMessages, conversationId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const createConvMutation = useCreateConversation();
  const sendMessageMutation = useSendMessage();
  const deleteConvMutation = useDeleteConversation();

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

    let currentConvId = conversationId;

    if (!currentConvId) {
      try {
        const newConv = await createConvMutation.mutateAsync({
          data: { title: content.substring(0, 40) + (content.length > 40 ? "..." : "") },
        });
        currentConvId = newConv.id;
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setLocation(`/chat/${newConv.id}`, { replace: true });
      } catch (e: unknown) {
        const err = e as { error?: string };
        toast({ title: "Erro", description: err.error || "Falha ao iniciar sessão.", variant: "destructive" });
        return;
      }
    }

    if (!currentConvId) return;

    const tempId = Date.now();
    const optimisticUserMsg: LocalMessage = {
      id: tempId,
      conversationId: currentConvId,
      role: "user",
      content,
      imageUrl: imageDataUrl ?? null,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const response = await sendMessageMutation.mutateAsync({
        id: currentConvId,
        data: { content, imageBase64: imageBase64 ?? null },
      });

      setLocalMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        response.userMessage as LocalMessage,
        response.assistantMessage as LocalMessage,
      ]);

      queryClient.setQueryData(getGetMeQueryKey(), (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...(old as object), dailyMessagesUsed: response.dailyMessagesUsed };
      });
    } catch (e: unknown) {
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
      const err = e as { error?: string };
      toast({
        title: "Falha ao enviar",
        description: err.error || "Tente novamente.",
        variant: "destructive",
      });
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

  const isPending = createConvMutation.isPending || sendMessageMutation.isPending;
  const isAtLimit = user?.plan === "free" && (user?.dailyMessagesUsed ?? 0) >= (user?.dailyLimit ?? 10);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative z-0">
      <div className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-background/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={openSidebar}
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </Button>
          <span className="text-sm text-muted-foreground font-medium truncate">
            {conversationId ? `Sessão #${conversationId}` : "Nova conversa"}
          </span>
        </div>
        {conversationId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleteConvMutation.isPending}
            data-testid="button-delete-conversation"
          >
            <Trash2 size={15} />
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-sm mx-auto px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/10"
            >
              <MessageSquare size={28} strokeWidth={1.5} />
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="text-xl font-bold mb-2">Como posso ajudar?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Faça uma pergunta, envie um texto ou uma imagem. A Nexa está pronta para você.
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {localMessages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mr-2.5 mt-1 self-start">
                      <MessageSquare size={13} className="text-primary" strokeWidth={2} />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] sm:max-w-[75%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-lg shadow-primary/20"
                        : "bg-card border border-white/[0.07] text-card-foreground rounded-2xl rounded-tl-sm shadow-lg"
                    } px-4 py-3`}
                    data-testid={`message-${msg.role}-${idx}`}
                  >
                    {msg.imageUrl && (
                      <div className="mb-2.5">
                        <img
                          src={msg.imageUrl}
                          alt="Imagem enviada"
                          className="rounded-xl max-h-64 w-auto object-contain border border-white/10"
                        />
                      </div>
                    )}
                    {msg.role === "assistant" && (
                      <div className="text-[10px] font-semibold text-primary/70 tracking-widest uppercase mb-1.5">
                        Nexa
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </motion.div>
              ))}

              {isPending && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mr-2.5 mt-1 self-start">
                    <MessageSquare size={13} className="text-primary" strokeWidth={2} />
                  </div>
                  <div className="bg-card border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                    <div className="text-[10px] font-semibold text-primary/70 tracking-widest uppercase mb-2">
                      Nexa
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span>Nexa pensando</span>
                      <span className="flex gap-0.5 mt-0.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1 h-1 rounded-full bg-primary/60 animate-bounce"
                            style={{ animationDelay: `${i * 180}ms` }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="px-3 md:px-6 py-3 md:py-4 bg-background shrink-0">
        <div className="max-w-3xl mx-auto">
          {isAtLimit && (
            <div className="mb-2 text-center text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg py-2 px-3">
              Limite diário atingido. Faça upgrade para PRO para continuar.
            </div>
          )}

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none" />
            <div className="relative bg-card border border-white/10 rounded-2xl shadow-2xl focus-within:border-primary/40 transition-colors">
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
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background border border-white/20 flex items-center justify-center hover:bg-destructive/20 transition-colors"
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
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isPending || isAtLimit}
                  title="Enviar imagem"
                >
                  <ImageIcon size={17} />
                </Button>

                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    autoResize(e.target);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={pendingImage ? "Pergunte sobre a imagem..." : "Mensagem para a Nexa..."}
                  className="flex-1 bg-transparent border-0 focus:ring-0 resize-none px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none min-h-[40px] max-h-40"
                  rows={1}
                  data-testid="input-chat"
                  disabled={isPending || isAtLimit}
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />

                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && !pendingImage) || isPending || isAtLimit}
                  data-testid="button-send-chat"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center mt-2 text-[10px] text-muted-foreground/30">
            A Nexa pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
}
