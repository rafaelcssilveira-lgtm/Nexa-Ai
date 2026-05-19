import React, { useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { BrainCircuit, Zap, Shield, ChevronRight, MessageSquare, Check, Sparkles, ImageIcon } from "lucide-react";

function GridBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  );
}

const features = [
  {
    icon: <Zap size={20} className="text-yellow-400" />,
    bg: "bg-yellow-400/10 border-yellow-400/10",
    title: "Respostas Instantâneas",
    description: "Processamento otimizado para máxima velocidade. Respostas rápidas sem interromper seu fluxo.",
  },
  {
    icon: <BrainCircuit size={20} className="text-primary" />,
    bg: "bg-primary/10 border-primary/10",
    title: "Memória Contextual",
    description: "Lembra de toda a conversa. Você não precisa repetir informações em cada mensagem.",
  },
  {
    icon: <Shield size={20} className="text-emerald-400" />,
    bg: "bg-emerald-400/10 border-emerald-400/10",
    title: "Privacidade Total",
    description: "Suas conversas são isoladas e protegidas. Seus dados nunca são usados para treinar modelos.",
  },
  {
    icon: <ImageIcon size={20} className="text-blue-400" />,
    bg: "bg-blue-400/10 border-blue-400/10",
    title: "Análise de Imagens",
    description: "Envie imagens para a Nexa analisar, descrever e responder perguntas sobre o conteúdo visual.",
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-80px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/[0.06] bg-background/85 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <MessageSquare size={15} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-bold text-[1.1rem] tracking-tight">Nexa</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link href="/chat">
              <Button size="sm" className="gap-1.5 font-medium" data-testid="link-go-to-chat">
                Abrir chat <ChevronRight size={14} />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:flex" data-testid="link-login">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-medium" data-testid="link-register">
                  Começar grátis
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col pt-16">
        <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 sm:px-8 py-20 overflow-hidden">
          <GridBackground />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/7 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-7">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 rounded-full px-4 py-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_theme(colors.green.400)]" />
              <span className="text-sm text-primary font-medium">Nexa online — Pronta para ajudar</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-[82px] font-extrabold tracking-tighter leading-[1.04]">
                <span className="text-foreground/90">Conheça a</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-blue-400">
                  Nexa!
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Inteligência artificial avançada que conversa, analisa imagens e resolve problemas complexos.
              Rápida, precisa e sempre disponível.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              <Link href={isAuthenticated ? "/chat" : "/register"}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/35 transition-shadow"
                  data-testid="button-hero-cta"
                >
                  Começar agora <ChevronRight size={18} />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                  >
                    Já tenho conta
                  </Button>
                </Link>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="text-xs text-muted-foreground/40 pt-1"
            >
              Grátis para começar. Sem cartão de crédito.
            </motion.p>
          </div>
        </section>

        <section ref={featuresRef} className="py-20 md:py-28 px-4 sm:px-8 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Por que a Nexa é diferente
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                Cada detalhe foi pensado para maximizar sua produtividade.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-white/[0.06] hover:border-primary/20 transition-all duration-300 group flex flex-col gap-4"
                >
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${f.bg}`}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1.5 group-hover:text-primary transition-colors text-sm sm:text-base">
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section ref={pricingRef} className="py-20 md:py-28 px-4 sm:px-8 bg-white/[0.015] border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Planos simples e honestos
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                Comece grátis. Faça upgrade quando precisar de mais poder.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={pricingInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="p-7 rounded-2xl bg-card border border-white/[0.08] flex flex-col"
              >
                <div className="mb-6">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Free</div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">R$0</span>
                    <span className="text-muted-foreground text-sm mb-1">/mês</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {["10 mensagens por dia", "Histórico de conversas", "Análise de imagens"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Check size={15} className="text-primary shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                    Começar grátis
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={pricingInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-7 rounded-2xl border border-primary/30 bg-primary/[0.04] flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,87,255,0.1),transparent)] pointer-events-none" />
                <div className="absolute top-5 right-5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-primary text-white px-2.5 py-1 rounded-full">
                    <Sparkles size={10} /> Popular
                  </span>
                </div>
                <div className="mb-6">
                  <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">Pro</div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">R$29</span>
                    <span className="text-muted-foreground text-sm mb-1">/mês</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {[
                    "Mensagens ilimitadas",
                    "Modelo GPT-4o (mais poderoso)",
                    "Envio de imagens ilimitado",
                    "Respostas mais detalhadas",
                    "Suporte prioritário",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <Check size={15} className="text-primary shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full shadow-lg shadow-primary/20">Assinar Pro</Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <section ref={ctaRef} className="py-20 px-4 sm:px-8 border-t border-white/[0.06] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,87,255,0.07),transparent)] pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl mx-auto space-y-5"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground">
              Crie sua conta grátis agora e experimente a Nexa.
            </p>
            <div className="pt-1">
              <Link href={isAuthenticated ? "/chat" : "/register"}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold gap-2 shadow-xl shadow-primary/20"
                >
                  {isAuthenticated ? "Ir para o chat" : "Criar conta grátis"} <ChevronRight size={18} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-8 px-4 sm:px-8 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/80 flex items-center justify-center">
              <MessageSquare size={11} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Nexa</span>
          </div>
          <p className="text-xs text-muted-foreground/40">
            &copy; {new Date().getFullYear()} Nexa. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
