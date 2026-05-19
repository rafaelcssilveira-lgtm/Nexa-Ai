import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useListMessages, 
  getListMessagesQueryKey, 
  useSendMessage, 
  useCreateConversation,
  useDeleteConversation,
  getGetMeQueryKey,
  getListConversationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TerminalSquare, Send, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@workspace/api-client-react";

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
  
  const [inputValue, setInputValue] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: serverMessages, isLoading: isLoadingMessages } = useListMessages(
    conversationId || 0,
    { query: { enabled: !!conversationId, queryKey: getListMessagesQueryKey(conversationId || 0) } }
  );

  useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages);
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

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const content = inputValue.trim();
    setInputValue("");

    let currentConvId = conversationId;

    if (!currentConvId) {
      try {
        const newConv = await createConvMutation.mutateAsync({ 
          data: { title: content.substring(0, 40) + (content.length > 40 ? "..." : "") } 
        });
        currentConvId = newConv.id;
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        // Don't navigate yet, we'll navigate after sending the message or just silently update the URL
        setLocation(`/chat/${newConv.id}`, { replace: true });
      } catch (e: any) {
        toast({ title: "System Error", description: e.error || "Failed to initiate session.", variant: "destructive" });
        return;
      }
    }

    if (!currentConvId) return;

    // Optimistic UI update
    const tempId = Date.now();
    const optimisticUserMsg: Message = {
      id: tempId,
      conversationId: currentConvId,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    setLocalMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const response = await sendMessageMutation.mutateAsync({
        id: currentConvId,
        data: { content }
      });
      
      // Update with real messages and usage
      setLocalMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        response.userMessage,
        response.assistantMessage
      ]);
      
      // Patch user cache to update daily usage
      queryClient.setQueryData(getGetMeQueryKey(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          dailyMessagesUsed: response.dailyMessagesUsed
        };
      });

    } catch (e: any) {
      // Revert optimistic update on error
      setLocalMessages(prev => prev.filter(m => m.id !== tempId));
      toast({ 
        title: "Transmission Failed", 
        description: e.error || "Failed to send message.", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = () => {
    if (!conversationId) return;
    deleteConvMutation.mutate({ id: conversationId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setLocation("/chat");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isPending = createConvMutation.isPending || sendMessageMutation.isPending;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative z-0">
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-background/80 backdrop-blur shrink-0">
        <div className="font-mono text-sm tracking-widest text-muted-foreground">
          {conversationId ? `SESSION_${conversationId}` : "NEW_SESSION"}
        </div>
        {conversationId && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleteConvMutation.isPending}
            data-testid="button-delete-conversation"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
              <TerminalSquare size={32} />
            </div>
            <h2 className="text-xl font-bold">Awaiting Input</h2>
            <p className="text-sm text-muted-foreground">
              Provide instructions to initialize the cognitive routine. Nexa is ready to process your request.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {localMessages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-card border border-white/5 text-card-foreground rounded-tl-sm shadow-xl'
                  }`}
                  data-testid={`message-${msg.role}-${idx}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 font-mono text-xs text-primary tracking-wider">
                      <TerminalSquare size={12} /> NEXA_CORE
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-card border border-white/5 text-card-foreground rounded-tl-sm shadow-xl">
                  <div className="flex items-center gap-2 font-mono text-xs text-primary tracking-wider mb-2">
                    <TerminalSquare size={12} /> NEXA_CORE
                  </div>
                  <div className="flex items-center gap-1 h-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-background shrink-0">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative flex items-end gap-2 bg-card border border-white/10 rounded-xl p-2 shadow-2xl focus-within:border-primary/50 transition-colors">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Transmit directive..."
              className="flex-1 max-h-48 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              rows={1}
              data-testid="input-chat"
              disabled={isPending || (user?.plan === 'free' && user.dailyMessagesUsed >= user.dailyLimit)}
            />
            <Button 
              size="icon" 
              className="h-11 w-11 shrink-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground" 
              onClick={handleSend}
              disabled={!inputValue.trim() || isPending || (user?.plan === 'free' && user.dailyMessagesUsed >= user.dailyLimit)}
              data-testid="button-send-chat"
            >
              {isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </Button>
          </div>
          
          {user?.plan === 'free' && user.dailyMessagesUsed >= user.dailyLimit && (
            <div className="absolute -top-10 left-0 right-0 text-center text-xs text-destructive font-mono bg-destructive/10 py-1.5 rounded border border-destructive/20">
              CAPACITY_EXCEEDED. UPGRADE REQUIRED TO CONTINUE.
            </div>
          )}
        </div>
        <div className="text-center mt-3 text-[10px] font-mono text-muted-foreground">
          Nexa may produce deterministic artifacts. Verify critical outputs.
        </div>
      </div>
    </div>
  );
}
