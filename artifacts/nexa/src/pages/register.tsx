import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageSquare, Loader2, ArrowRight, Check, Zap, Shield, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const perks = [
  { icon: <Zap size={16} className="text-yellow-400" />, text: "Respostas instantâneas" },
  { icon: <BrainCircuit size={16} className="text-primary" />, text: "Memória de contexto avançada" },
  { icon: <Shield size={16} className="text-emerald-400" />, text: "100% privado e seguro" },
  { icon: <Check size={16} className="text-primary" />, text: "Grátis para começar" },
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
      onSuccess: async () => {
        await queryClient.refetchQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Conta criada!", description: "Bem-vindo à Nexa." });
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
    <div className="min-h-screen flex bg-background overflow-hidden">
      <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center p-12 border-r border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-10 max-w-sm w-full text-center"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
              <MessageSquare size={26} className="text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Nexa</h2>
            <p className="text-muted-foreground text-sm mt-1.5">Crie sua conta e comece agora</p>
          </div>

          <div className="w-full space-y-3">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold mb-4">
              O que você ganha
            </p>
            {perks.map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
                  {perk.icon}
                </div>
                <span className="text-sm text-foreground/80">{perk.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm space-y-7"
        >
          <div className="md:hidden flex flex-col items-center gap-3 mb-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <MessageSquare size={17} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl">Nexa</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Criar conta grátis</h1>
            <p className="text-muted-foreground text-sm mt-1.5">10 mensagens por dia, sem cartão de crédito</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome"
                        {...field}
                        data-testid="input-name"
                        className="h-11 bg-white/[0.04] border-white/10 focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com"
                        type="email"
                        {...field}
                        data-testid="input-email"
                        className="h-11 bg-white/[0.04] border-white/10 focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Senha</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        {...field}
                        data-testid="input-password"
                        className="h-11 bg-white/[0.04] border-white/10 focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-1">
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold gap-2 shadow-lg shadow-primary/20"
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

          <div className="text-sm text-muted-foreground text-center">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-go-to-login">
              Entrar
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
