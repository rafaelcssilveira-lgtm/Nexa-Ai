import React, { useState, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogoutUser, getGetMeQueryKey, useListConversations, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PenSquare, LogOut, MessageSquare, CreditCard, User, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const SidebarContext = createContext({ openSidebar: () => {} });
export const useSidebarToggle = () => useContext(SidebarContext);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ openSidebar: () => setMobileOpen(true) }}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div className="hidden md:flex flex-col w-64 border-r border-white/[0.05] bg-sidebar h-full z-10 shrink-0">
          <SidebarContent onClose={() => {}} />
        </div>

        <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-[260px] bg-sidebar border-r border-white/[0.05] [&>button]:hidden"
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

  return (
    <div className="flex flex-col h-full select-none">
      {/* Brand header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.05] shrink-0">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
            <MessageSquare size={13} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-bold tracking-tight text-[1.05rem]">Nexa</span>
        </Link>
        {user?.plan === "pro" && (
          <span
            className="flex items-center gap-1 bg-primary/15 text-primary border border-primary/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            data-testid="badge-pro"
          >
            <Sparkles size={9} /> PRO
          </span>
        )}
      </div>

      {/* New chat button */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <Link href="/chat" onClick={onClose}>
          <Button
            variant="ghost"
            className="w-full justify-between text-[13px] gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] h-9 px-3 rounded-xl transition-all"
            data-testid="button-new-chat"
          >
            <span>Nova conversa</span>
            <PenSquare size={14} className="opacity-60" />
          </Button>
        </Link>
      </div>

      {/* Conversations */}
      <div className="px-2 pt-4 pb-1 shrink-0">
        <p className="text-[10px] uppercase font-semibold text-sidebar-foreground/30 tracking-widest px-2 mb-1">
          Histórico
        </p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-2 py-2.5">
                <Skeleton className="h-3.5 w-full bg-white/[0.04] rounded" />
              </div>
            ))
          ) : !conversations?.length ? (
            <div className="py-8 text-center">
              <MessageSquare size={22} className="mx-auto mb-2 text-sidebar-foreground/15" />
              <p className="text-xs text-sidebar-foreground/25">Nenhuma conversa ainda</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = location === `/chat/${conv.id}`;
              return (
                <Link key={conv.id} href={`/chat/${conv.id}`} onClick={onClose}>
                  <div
                    className={`w-full text-left px-3 py-2 rounded-xl text-[13px] truncate cursor-pointer transition-all flex items-center gap-2 group ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-sidebar-foreground/50 hover:bg-white/[0.05] hover:text-sidebar-foreground/80"
                    }`}
                    data-testid={`link-conversation-${conv.id}`}
                  >
                    <MessageSquare
                      size={12}
                      className={`shrink-0 transition-opacity ${isActive ? "opacity-70" : "opacity-30 group-hover:opacity-50"}`}
                    />
                    <span className="truncate">{conv.title}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Bottom section */}
      <div className="border-t border-white/[0.05] p-3 space-y-2 shrink-0">
        {user?.plan === "free" && (
          <Link href="/plans" onClick={onClose}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-primary hover:text-primary hover:bg-primary/10 justify-between px-2 rounded-xl border border-primary/20 hover:border-primary/40 transition-all"
              data-testid="button-upgrade-sidebar"
            >
              <span className="flex items-center gap-1.5"><Sparkles size={10} /> Fazer upgrade para Pro</span>
              <ChevronRight size={12} />
            </Button>
          </Link>
        )}

        {/* Nav links */}
        <div className="space-y-0.5">
          <Link href="/profile" onClick={onClose}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/[0.05] gap-2.5 h-9 px-3 text-[13px] rounded-xl"
              data-testid="link-profile"
            >
              <User size={14} />
              <span className="truncate flex-1 text-left">{user?.name || "Perfil"}</span>
            </Button>
          </Link>
          <Link href="/plans" onClick={onClose}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/[0.05] gap-2.5 h-9 px-3 text-[13px] rounded-xl"
              data-testid="link-plans"
            >
              <CreditCard size={14} /> Assinatura
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 gap-2.5 h-9 px-3 text-[13px] rounded-xl"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut size={14} /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
