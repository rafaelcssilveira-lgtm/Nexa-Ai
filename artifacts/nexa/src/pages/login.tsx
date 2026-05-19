import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginUser, getGetMeQueryKey } from "@workspace/api-client-react";
import type { AuthUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageSquare, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLoginUser();

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: (userData) => {
        queryClient.setQueryData(getGetMeQueryKey(), userData as AuthUser);
        setLocation("/chat");
      },
      onError: (error) => {
        const msg = (error as { data?: { error?: string } })?.data?.error;
        toast({
          title: "Erro ao entrar",
          description: msg || "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d18] via-background to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[480px] h-[480px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-500/8 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                <MessageSquare size={20} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Nexa</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold tracking-tighter leading-tight">
                IA que entende<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-blue-400">
                  você de verdade.
                </span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
                Converse, analise imagens e resolva problemas complexos com inteligência artificial avançada.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2.5">
              {["Análise de imagens", "Memória contextual", "Respostas precisas", "100% privado"].map((feat) => (
                <span
                  key={feat}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5"
                >
                  <Sparkles size={11} className="text-primary" />
                  {feat}
                </span>
              ))}
            </div>

            {/* Decorative chat preview */}
            <div className="space-y-3 max-w-xs">
              {[
                { role: "user", text: "Analise essa imagem para mim" },
                { role: "ai", text: "Vejo uma paisagem urbana ao entardecer com prédios modernos e céu alaranjado..." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: item.role === "user" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.25, duration: 0.5 }}
                  className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {item.role === "ai" && (
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                      <MessageSquare size={11} className="text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] text-xs px-3.5 py-2.5 rounded-xl leading-relaxed ${
                    item.role === "user"
                      ? "bg-primary/20 text-primary/90 border border-primary/20 rounded-tr-sm"
                      : "bg-white/[0.05] text-muted-foreground border border-white/[0.06] rounded-tl-sm"
                  }`}>
                    {item.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Mobile background glow */}
        <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-72 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px] space-y-8 relative z-10"
        >
          {/* Mobile brand */}
          <div className="lg:hidden flex flex-col items-center gap-3 pb-2">
            <Link href="/">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
                  <MessageSquare size={18} strokeWidth={2.5} className="text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Nexa</span>
              </div>
            </Link>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Bem-vindo de volta</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Entre na sua conta para continuar</p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                        data-testid="input-email"
                        className="h-11 bg-white/[0.04] border-white/[0.1] focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Senha</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                        {...field}
                        data-testid="input-password"
                        className="h-11 bg-white/[0.04] border-white/[0.1] focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="pt-1">
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow text-base"
                  disabled={loginMutation.isPending}
                  data-testid="button-submit-login"
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>
                  ) : (
                    <>Entrar <ArrowRight size={16} /></>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-sm text-center text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors" data-testid="link-go-to-register">
              Criar conta grátis
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
