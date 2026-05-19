import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetUserProfile, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { User, BarChart2, MessageSquare, Layers, Calendar, CreditCard, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetUserProfile({
    query: { queryKey: getGetUserProfileQueryKey() }
  });

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="max-w-2xl mx-auto space-y-6">

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl font-bold tracking-tight">Meu perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">Suas informações e estatísticas de uso</p>
          </motion.div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-36 w-full rounded-2xl bg-card border border-white/5" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl bg-card border border-white/5" />
                ))}
              </div>
            </div>
          ) : profile ? (
            <>
              {/* Profile card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 }}
                className="relative bg-card border border-white/[0.07] rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent)] pointer-events-none" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold uppercase shrink-0 shadow-lg shadow-primary/10">
                    {profile.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold tracking-tight truncate">{profile.name}</h2>
                      {profile.plan === "pro" ? (
                        <span className="flex items-center gap-1 bg-primary/15 text-primary border border-primary/25 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Sparkles size={9} /> PRO
                        </span>
                      ) : (
                        <span className="bg-white/[0.06] text-muted-foreground border border-white/[0.08] text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{profile.email}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1.5 flex items-center gap-1">
                      <Calendar size={11} />
                      Membro desde {format(new Date(profile.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {profile.plan === "free" && (
                  <div className="relative z-10 mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Faça upgrade para acesso ilimitado</p>
                    <Link href="/plans">
                      <Button size="sm" className="h-7 text-xs gap-1.5 shadow-md shadow-primary/15">
                        <Sparkles size={11} /> Assinar Pro
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: <BarChart2 size={18} className="text-emerald-400" />,
                    bg: "bg-emerald-400/10 border-emerald-400/15",
                    label: "Uso hoje",
                    value: `${profile.dailyMessagesUsed} / ${profile.dailyLimit}`,
                    sub: "mensagens no dia",
                    delay: 0.1,
                  },
                  {
                    icon: <MessageSquare size={18} className="text-primary" />,
                    bg: "bg-primary/10 border-primary/15",
                    label: "Total de mensagens",
                    value: profile.totalMessages.toLocaleString("pt-BR"),
                    sub: "mensagens enviadas",
                    delay: 0.15,
                  },
                  {
                    icon: <Layers size={18} className="text-blue-400" />,
                    bg: "bg-blue-400/10 border-blue-400/15",
                    label: "Conversas",
                    value: profile.totalConversations.toLocaleString("pt-BR"),
                    sub: "conversas criadas",
                    delay: 0.2,
                  },
                  {
                    icon: <CreditCard size={18} className="text-violet-400" />,
                    bg: "bg-violet-400/10 border-violet-400/15",
                    label: "Plano atual",
                    value: profile.plan === "pro" ? "Pro" : "Free",
                    sub: profile.plan === "pro" ? "acesso ilimitado" : "upgrade disponível",
                    delay: 0.25,
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: stat.delay }}
                    className="bg-card border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3"
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${stat.bg}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold tracking-tight leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">{stat.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <User size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Perfil não encontrado</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
