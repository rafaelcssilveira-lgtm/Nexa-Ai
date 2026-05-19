import React, { useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { BrainCircuit, Zap, Shield, ChevronRight, MessageSquare, Check, Sparkles, ImageIcon, ArrowRight } from "lucide-react";

const features = [
  {
    icon: <Zap size={19} className="text-yellow-400" />,
    bg: "bg-yellow-400/10 border-yellow-400/15",
    title: "Respostas instantâneas",
    description: "Processamento otimizado para máxima velocidade. Sem espera, sem interrupção no seu fluxo.",
  },
  {
    icon: <BrainCircuit size={19} className="text-primary" />,
    bg: "bg-primary/10 border-primary/15",
    title: "Memória contextual",
    description: "Lembra de toda a conversa para respostas cada vez mais precisas e personalizadas.",
  },
  {
    icon: <Shield size={19} className="text-emerald-400" />,
    bg: "bg-emerald-400/10 border-emerald-400/15",
    title: "Privacidade total",
    description: "Suas conversas são isoladas e protegidas. Seus dados nunca são usados para treinar modelos.",
  },
  {
    icon: <ImageIcon size={19} className="text-blue-400" />,
    bg: "bg-blue-400/10 border-blue-400/15",
    title: "Análise de imagens",
    description: "Envie qualquer imagem. A Nexa descreve, analisa e responde perguntas sobre o conteúdo visual.",
  },
];

const stats = [
  { value: "5.000+", label: "Usuários ativos" },
  { value: "50.000+", label: "Conversas" },
  { value: "99.9%", label: "Uptime" },
  { value: "<1s", label: "Tempo de resposta" },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-60px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-60px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-15 flex items-center justify-between px-4 sm:px-8 border-b border-white/[0.05] bg-background/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <MessageSquare size={13} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-bold text-[1.05rem] tracking-tight">Nexa</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link href="/chat">
              <Button size="sm" className="gap-1.5 font-medium shadow-md shadow-primary/15" data-testid="link-go-to-chat">
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
                <Button size="sm" className="font-medium shadow-md shadow-primary/15" data-testid="link-register">
                  Começar grátis
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col pt-15">
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center min-h-[92vh] px-4 sm:px-8 py-20 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:60px_60px]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            {/* Status pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 border border-primary/20 bg-primary/[0.06] rounded-full px-4 py-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_theme(colors.green.400)]" />
              <span className="text-sm text-primary font-medium">Nexa online — Pronta para ajudar</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-[80px] font-extrabold tracking-tighter leading-[1.06]">
                <span className="text-foreground/90">Conheça a</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-blue-400">
                  Nexa!
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed"
            >
              Inteligência artificial avançada que conversa, analisa imagens e resolve problemas.
              Rápida, precisa e sempre disponível.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1"
            >
              <Link href={isAuthenticated ? "/chat" : "/register"}>
                <Button
                  size="lg"
                  className="h-12 px-7 text-base font-semibold gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/35 transition-shadow"
                  data-testid="button-hero-cta"
                >
                  Começar agora <ArrowRight size={16} />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 text-base border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
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
              className="text-xs text-muted-foreground/40"
            >
              Grátis para começar. Sem cartão de crédito.
            </motion.p>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 border-t border-white/[0.06] mt-2"
            >
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-bold tracking-tight text-foreground/90">{s.value}</div>
                  <div className="text-xs text-muted-foreground/50 mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section ref={featuresRef} className="py-20 md:py-28 px-4 sm:px-8 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Por que a Nexa é diferente
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
                Cada detalhe foi pensado para maximizar sua produtividade.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="p-6 rounded-2xl bg-card border border-white/[0.06] hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300 group flex flex-col gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${f.bg} transition-transform group-hover:scale-105`}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1.5 text-sm sm:text-[15px] group-hover:text-primary transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section ref={pricingRef} className="py-20 md:py-28 px-4 sm:px-8 bg-white/[0.012] border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Planos simples e honestos
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
                Comece grátis. Faça upgrade quando precisar de mais poder.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Free */}
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                animate={pricingInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="p-7 rounded-2xl bg-card border border-white/[0.08] flex flex-col"
              >
                <div className="mb-6">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Free</div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">Grátis</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sem cartão de crédito</p>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {["54 mensagens por dia", "Histórico de conversas", "Análise de imagens"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <div className="w-4 h-4 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0">
                        <Check size={10} className="text-muted-foreground" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                    Começar grátis
                  </Button>
                </Link>
              </motion.div>

              {/* Pro */}
              <motion.div
                initial={{ opacity: 0, x: 18 }}
                animate={pricingInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-7 rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.07] to-transparent flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,87,255,0.1),transparent)] pointer-events-none" />
                <div className="absolute top-5 right-5">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold bg-primary text-white px-2.5 py-1 rounded-full shadow-lg shadow-primary/30">
                    <Sparkles size={9} /> Popular
                  </span>
                </div>
                <div className="mb-6 relative z-10">
                  <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">Pro</div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">R$29</span>
                    <span className="text-muted-foreground text-sm mb-1">/mês</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1 relative z-10">
                  {[
                    "Mensagens ilimitadas",
                    "Modelo mais poderoso (GPT-5)",
                    "Análise de imagens ilimitada",
                    "Respostas mais longas e detalhadas",
                    "Suporte prioritário",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-primary" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="relative z-10">
                  <Link href="/register">
                    <Button className="w-full shadow-lg shadow-primary/20 gap-2">
                      Assinar Pro <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section ref={ctaRef} className="py-20 px-4 sm:px-8 border-t border-white/[0.05] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.07),transparent)] pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="relative z-10 max-w-xl mx-auto space-y-5"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Crie sua conta grátis e experimente a Nexa. Sem cartão de crédito.
            </p>
            <div className="pt-1">
              <Link href={isAuthenticated ? "/chat" : "/register"}>
                <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 shadow-xl shadow-primary/20">
                  {isAuthenticated ? "Ir para o chat" : "Criar conta grátis"} <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-7 px-4 sm:px-8 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/80 flex items-center justify-center">
              <MessageSquare size={9} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Nexa</span>
          </div>
          <p className="text-xs text-muted-foreground/35">
            &copy; {new Date().getFullYear()} Nexa. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
