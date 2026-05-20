import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterUser, getGetMeQueryKey } from "@workspace/api-client-react";
import type { AuthUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageSquare, Loader2, ArrowRight, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const perks = [
  "54 mensagens por dia no plano grátis",
  "Análise de imagens com IA",
  "Histórico de conversas salvo",
  "Upgrade para ilimitado a qualquer hora",
];

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const registerMutation = useRegisterUser();

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: (userData) => {
        queryClient.setQueryData(getGetMeQueryKey(), userData as AuthUser);
        setLocation("/chat");
      },
      onError: (error) => {
        const msg = (error as { data?: { error?: string } })?.data?.error;
        toast({
          title: "Erro ao criar conta",
          description: msg || "Tente novamente.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d18] via-background to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[480px] h-[480px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-violet-500/8 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                <MessageSquare size={20} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Nexa</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold tracking-tighter leading-tight">
                Comece de graça.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-blue-400">
                  Evolua sem limites.
                </span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
                Crie sua conta grátis e descubra o que a inteligência artificial pode fazer por você.
              </p>
            </div>

            <div className="space-y-3">
              {perks.map((perk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{perk}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <Sparkles size={16} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">Sem cartão de crédito</span> — comece grátis hoje mesmo.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-72 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px] space-y-7 relative z-10"
        >
          {/* Mobile brand */}
          <div className="lg:hidden flex flex-col items-center gap-3 pb-1">
            <Link href="/">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
                  <MessageSquare size={18} strokeWidth={2.5} className="text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Nexa</span>
              </div>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Criar conta grátis</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Sem cartão de crédito. Comece agora.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome"
                        autoComplete="name"
                        {...field}
                        data-testid="input-name"
                        className="h-11 bg-white/[0.04] border-white/[0.1] focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
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
                        placeholder="Mínimo 6 caracteres"
                        type="password"
                        autoComplete="new-password"
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
                  disabled={registerMutation.isPending}
                  data-testid="button-submit-register"
                >
                  {registerMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta...</>
                  ) : (
                    <>Criar conta grátis <ArrowRight size={16} /></>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors" data-testid="link-go-to-login">
              Entrar
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
