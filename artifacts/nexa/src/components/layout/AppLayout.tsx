import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogoutUser, getGetMeQueryKey, useListConversations, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { TerminalSquare, MessageSquarePlus, Settings, LogOut, MessageSquare, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutUser();

  const { data: conversations, isLoading } = useListConversations({
    query: {
      queryKey: getListConversationsQueryKey()
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      }
    });
  };

  const usagePercent = user ? (user.dailyMessagesUsed / user.dailyLimit) * 100 : 0;

  return (
    <div className="w-72 border-r border-white/5 bg-sidebar flex flex-col h-full z-10 flex-shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <Link href="/chat" className="flex items-center gap-2 text-sidebar-foreground hover:text-primary transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <TerminalSquare size={18} />
          </div>
          <span className="font-mono font-bold tracking-tight text-lg">NEXA</span>
        </Link>
        {user?.plan === 'pro' && (
          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 font-mono text-[10px] px-1.5" data-testid="badge-pro">PRO</Badge>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 pb-2">
        <Link href="/chat">
          <Button variant="default" className="w-full justify-start font-mono text-sm gap-2 bg-white/5 text-sidebar-foreground hover:bg-white/10 border border-white/5 hover:border-white/10 shadow-none" data-testid="button-new-chat">
            <MessageSquarePlus size={16} />
            NEW_SESSION
          </Button>
        </Link>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-mono text-sidebar-foreground/50 tracking-wider mb-1">HISTORY</div>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-2 py-2">
                <Skeleton className="h-5 w-full bg-white/5 rounded" />
              </div>
            ))
          ) : conversations?.length === 0 ? (
            <div className="px-2 py-4 text-sm text-sidebar-foreground/40 text-center font-mono">
              NO_ACTIVE_SESSIONS
            </div>
          ) : (
            conversations?.map((conv) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <div 
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate cursor-pointer transition-colors flex items-center gap-2 group ${location === `/chat/${conv.id}` ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground'}`}
                  data-testid={`link-conversation-${conv.id}`}
                >
                  <MessageSquare size={14} className="opacity-50 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Usage & Profile Footer */}
      <div className="mt-auto border-t border-white/5 p-4 flex flex-col gap-4">
        {user && user.plan === 'free' && (
          <div className="bg-black/20 rounded-lg p-3 border border-white/5">
            <div className="flex justify-between text-xs font-mono text-sidebar-foreground/70 mb-2">
              <span>USAGE</span>
              <span>{user.dailyMessagesUsed}/{user.dailyLimit}</span>
            </div>
            <Progress value={usagePercent} className="h-1 bg-white/5" />
            <Link href="/plans">
              <Button variant="link" className="w-full text-xs text-primary h-auto p-0 mt-3 justify-between" data-testid="button-upgrade-sidebar">
                UPGRADE SYSTEM <ChevronRight size={12} />
              </Button>
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5 gap-2 h-9 px-2" data-testid="link-profile">
              <Settings size={16} /> <span className="truncate flex-1 text-left">{user?.name}</span>
            </Button>
          </Link>
          <Link href="/plans">
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5 gap-2 h-9 px-2" data-testid="link-plans">
              <CreditCard size={16} /> Subscription
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 gap-2 h-9 px-2" onClick={handleLogout} data-testid="button-logout">
            <LogOut size={16} /> Terminate
          </Button>
        </div>
      </div>
    </div>
  );
}
