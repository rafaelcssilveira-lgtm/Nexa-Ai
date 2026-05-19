import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListPlans, getListPlansQueryKey, useCreatePaymentPreference } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Check, ShieldAlert, Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
          title: "Transaction Error",
          description: msg || "Unable to initialize payment sequence.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto px-6 py-12 md:py-24">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">System Capacities</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Upgrade your operator clearance for extended computational access and zero latency restrictions.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Skeleton className="h-[500px] rounded-2xl bg-card border border-white/5" />
              <Skeleton className="h-[500px] rounded-2xl bg-card border border-white/5" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans?.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`relative flex flex-col p-8 rounded-2xl border ${
                    plan.recommended 
                      ? 'bg-card border-primary shadow-[0_0_40px_-15px_rgba(var(--primary),0.3)]' 
                      : 'bg-black/20 border-white/10'
                  }`}
                  data-testid={`card-plan-${plan.id}`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <span className="bg-primary text-primary-foreground text-xs font-mono px-3 py-1 rounded-full font-bold tracking-wider">
                        RECOMMENDED
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold uppercase tracking-widest text-muted-foreground mb-2 font-mono">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-sm text-muted-foreground font-mono">/{plan.currency}</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 mb-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          <Check size={16} className={plan.recommended ? 'text-primary' : 'text-muted-foreground'} />
                        </div>
                        <span className="text-sm leading-relaxed text-foreground/80">{feature}</span>
                      </div>
                    ))}
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0">
                        <Zap size={16} className={plan.recommended ? 'text-primary' : 'text-muted-foreground'} />
                      </div>
                      <span className="text-sm leading-relaxed text-foreground/80 font-mono">
                        {plan.dailyLimit} REQUESTS / DAY
                      </span>
                    </div>
                  </div>

                  {user?.plan === plan.id ? (
                    <Button variant="outline" className="w-full font-mono pointer-events-none opacity-50 bg-white/5" disabled data-testid={`button-current-plan-${plan.id}`}>
                      CURRENT_CLEARANCE
                    </Button>
                  ) : (
                    <Button 
                      variant={plan.recommended ? "default" : "secondary"} 
                      className={`w-full font-mono ${plan.recommended ? 'shadow-lg shadow-primary/25' : ''}`}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={paymentMutation.isPending}
                      data-testid={`button-upgrade-${plan.id}`}
                    >
                      {paymentMutation.isPending && paymentMutation.variables?.data.planId === plan.id ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : null}
                      AUTHORIZE_UPGRADE
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground font-mono">
            <ShieldAlert size={16} className="text-emerald-500" />
            SECURE_ENCRYPTED_TRANSACTION
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
