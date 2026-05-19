import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListPlans, getListPlansQueryKey, useCreatePaymentPreference } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Check, Shield, Zap, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function PlansPage() {
  const { user } = useAuth();
  const { data: plans, isLoading } = useListPlans({
    query: { queryKey: getListPlansQueryKey() }
  });

  const paymentMutation = useCreatePaymentPreference();
  const { toast } = useToast();

  const handleUpgrade = (planId: string) => {
    paymentMutation.mutate({ data: { planId } }, {
      onSuccess: (data) => {
        window.location.href = data.initPoint;
      },
      onError: (err) => {
        const msg = (err as { data?: { error?: string } })?.data?.error;
        toast({
          title: "Erro ao iniciar pagamento",
          description: msg || "Não foi possível iniciar o checkout. Tente novamente.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 rounded-full px-3.5 py-1.5 text-xs font-medium text-primary mb-1">
              <Sparkles size={11} /> Escolha seu plano
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Simples e sem surpresas
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
              Comece grátis e faça upgrade quando precisar de mais poder.
            </p>
          </motion.div>

          {/* Plan cards */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Skeleton className="h-[440px] rounded-2xl bg-card border border-white/5" />
              <Skeleton className="h-[440px] rounded-2xl bg-card border border-white/5" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {plans?.map((plan, i) => {
                const isCurrent = user?.plan === plan.id;
                const isPro = plan.recommended;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`relative flex flex-col p-7 rounded-2xl border transition-all ${
                      isPro
                        ? "bg-gradient-to-b from-primary/[0.07] to-transparent border-primary/25 shadow-xl shadow-primary/10"
                        : "bg-card border-white/[0.08]"
                    }`}
                    data-testid={`card-plan-${plan.id}`}
                  >
                    {/* Glow for PRO */}
                    {isPro && (
                      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent)] pointer-events-none" />
                    )}

                    {/* Popular badge */}
                    {isPro && (
                      <div className="absolute -top-3 inset-x-0 flex justify-center">
                        <span className="flex items-center gap-1.5 bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary/30">
                          <Sparkles size={9} /> Mais popular
                        </span>
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Plan name */}
                      <div className="mb-5">
                        <div className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${isPro ? "text-primary" : "text-muted-foreground"}`}>
                          {plan.name}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold tracking-tight">
                            {plan.price === 0 ? "Grátis" : `R$${plan.price}`}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-muted-foreground text-sm">/mês</span>
                          )}
                        </div>
                        {plan.price === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">Sem cartão de crédito</p>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 flex-1 mb-7">
                        {plan.features.map((feature, fi) => (
                          <li key={fi} className="flex items-start gap-2.5 text-sm">
                            <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isPro ? "bg-primary/15" : "bg-white/[0.06]"}`}>
                              <Check size={10} className={isPro ? "text-primary" : "text-muted-foreground"} />
                            </div>
                            <span className={isPro ? "text-foreground/90" : "text-muted-foreground"}>
                              {feature}
                            </span>
                          </li>
                        ))}
                        <li className="flex items-start gap-2.5 text-sm">
                          <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isPro ? "bg-primary/15" : "bg-white/[0.06]"}`}>
                            <Zap size={10} className={isPro ? "text-primary" : "text-muted-foreground"} />
                          </div>
                          <span className={isPro ? "text-foreground/90" : "text-muted-foreground"}>
                            {plan.dailyLimit >= 9000 ? "Mensagens ilimitadas" : `${plan.dailyLimit} mensagens por dia`}
                          </span>
                        </li>
                      </ul>

                      {/* CTA */}
                      {isCurrent ? (
                        <Button
                          variant="outline"
                          className="w-full pointer-events-none opacity-60 border-white/10 bg-white/[0.03]"
                          disabled
                          data-testid={`button-current-plan-${plan.id}`}
                        >
                          Plano atual
                        </Button>
                      ) : (
                        <Button
                          variant={isPro ? "default" : "outline"}
                          className={`w-full gap-2 ${isPro ? "shadow-lg shadow-primary/20 hover:shadow-primary/30" : "border-white/10 hover:bg-white/5"}`}
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={paymentMutation.isPending}
                          data-testid={`button-upgrade-${plan.id}`}
                        >
                          {paymentMutation.isPending && paymentMutation.variables?.data.planId === plan.id ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : null}
                          {isPro ? (
                            <><span>Assinar Pro</span><ArrowRight size={14} /></>
                          ) : (
                            "Começar grátis"
                          )}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Trust footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50"
          >
            <Shield size={13} className="text-emerald-500/70" />
            Pagamento seguro via Mercado Pago. Cancele quando quiser.
          </motion.div>

        </div>
      </div>
    </AppLayout>
  );
}
