import React, { useState, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogoutUser, getGetMeQueryKey, useListConversations, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Settings, LogOut, MessageSquare, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const SidebarContext = createContext({ openSidebar: () => {} });
export const useSidebarToggle = () => useContext(SidebarContext);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ openSidebar: () => setMobileOpen(true) }}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="hidden md:flex flex-col w-72 border-r border-white/5 bg-sidebar h-full z-10 shrink-0">
          <SidebarContent onClose={() => {}} />
        </div>

        <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-[280px] bg-sidebar border-r border-white/5 [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogoutUser();

  const { data: conversations, isLoading } = useListConversations({
    query: { queryKey: getListConversationsQueryKey() },
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        onClose();
        setLocation("/");
      },
    });
  };

  const usagePercent = user ? Math.min((user.dailyMessagesUsed / user.dailyLimit) * 100, 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center gap-2 text-sidebar-foreground hover:text-primary transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <MessageSquare size={15} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg">Nexa</span>
        </Link>
        {user?.plan === "pro" && (
          <Badge
            variant="default"
            className="bg-primary/20 text-primary border-primary/30 font-semibold text-[10px] px-1.5"
            data-testid="badge-pro"
          >
            PRO
          </Badge>
        )}
      </div>

      <div className="p-3 shrink-0">
        <Link href="/chat" onClick={onClose}>
          <Button
            variant="default"
            className="w-full justify-start text-sm gap-2 bg-white/5 text-sidebar-foreground hover:bg-white/10 border border-white/5 hover:border-white/10 shadow-none"
            data-testid="button-new-chat"
          >
            <MessageSquarePlus size={15} />
            Nova conversa
          </Button>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-2">
          <div className="px-2 py-2 text-[10px] uppercase font-semibold text-sidebar-foreground/40 tracking-widest">
            Histórico
          </div>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-2 py-2">
                <Skeleton className="h-4 w-full bg-white/5 rounded" />
              </div>
            ))
          ) : !conversations?.length ? (
            <div className="px-3 py-6 text-xs text-sidebar-foreground/30 text-center">
              Nenhuma conversa ainda
            </div>
          ) : (
            conversations.map((conv) => (
              <Link key={conv.id} href={`/chat/${conv.id}`} onClick={onClose}>
                <div
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate cursor-pointer transition-all flex items-center gap-2 group ${
                    location === `/chat/${conv.id}`
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground"
                  }`}
                  data-testid={`link-conversation-${conv.id}`}
                >
                  <MessageSquare size={13} className="opacity-40 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="mt-auto border-t border-white/5 p-3 flex flex-col gap-2 shrink-0">
        {user?.plan === "free" && (
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between text-[10px] font-medium text-sidebar-foreground/50 mb-1.5">
              <span>Uso diário</span>
              <span>
                {user.dailyMessagesUsed}/{user.dailyLimit}
              </span>
            </div>
            <Progress value={usagePercent} className="h-1 bg-white/5" />
            <Link href="/plans" onClick={onClose}>
              <Button
                variant="link"
                className="w-full text-xs text-primary h-auto p-0 mt-2.5 justify-between font-medium"
                data-testid="button-upgrade-sidebar"
              >
                Fazer upgrade <ChevronRight size={12} />
              </Button>
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          <Link href="/profile" onClick={onClose}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5 gap-2 h-9 px-2 text-sm"
              data-testid="link-profile"
            >
              <Settings size={15} />
              <span className="truncate flex-1 text-left">{user?.name}</span>
            </Button>
          </Link>
          <Link href="/plans" onClick={onClose}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5 gap-2 h-9 px-2 text-sm"
              data-testid="link-plans"
            >
              <CreditCard size={15} /> Assinatura
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 gap-2 h-9 px-2 text-sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut size={15} /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
