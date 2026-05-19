import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageSquare, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const chatExamples = [
  { role: "user" as const, text: "Explique machine learning de forma simples" },
  { role: "ai" as const, text: "Claro! É quando ensinamos computadores a aprender com dados, encontrando padrões por conta própria..." },
  { role: "user" as const, text: "Pode analisar essa imagem para mim?" },
  { role: "ai" as const, text: "Com certeza! Envie a imagem e eu descreverei tudo que encontrar nela." },
];

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
      onSuccess: async () => {
        await queryClient.refetchQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
        setLocation("/chat");
      },
      onError: (error) => {
        const msg = (error as { data?: { error?: string } })?.data?.error;
        toast({
          title: "Erro ao entrar",
          description: msg || "Verifique suas credenciais.",
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
          className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full"
        >
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
              <MessageSquare size={26} className="text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Nexa</h2>
            <p className="text-muted-foreground text-sm mt-1.5">Inteligência artificial avançada</p>
          </div>

          <div className="w-full space-y-2.5">
            {chatExamples.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: item.role === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.2, duration: 0.5 }}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] text-xs px-3.5 py-2.5 rounded-xl leading-relaxed ${
                    item.role === "user"
                      ? "bg-primary/20 text-primary/90 border border-primary/20 rounded-tr-sm"
                      : "bg-white/5 text-muted-foreground border border-white/5 rounded-tl-sm"
                  }`}
                >
                  {item.text}
                </div>
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
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Acesse sua conta para continuar</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="text-sm text-muted-foreground text-center">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-go-to-register">
              Criar conta grátis
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
