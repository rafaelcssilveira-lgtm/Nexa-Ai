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
import { TerminalSquare, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Authentication successful", description: "Welcome back." });
        setLocation("/chat");
      },
      onError: (error) => {
        const msg = (error as { data?: { error?: string } })?.data?.error;
        toast({ 
          title: "Authentication failed", 
          description: msg || "Please check your credentials.", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Link href="/" className="flex items-center justify-center w-12 h-12 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            <TerminalSquare size={24} />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Access Console</h1>
            <p className="text-sm text-muted-foreground mt-2">Enter your credentials to continue</p>
          </div>
        </div>

        <div className="p-8 border border-white/10 rounded-xl bg-card shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="operator@nexa.system" type="email" {...field} data-testid="input-email" className="bg-background/50 focus-visible:ring-primary/50" />
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
                    <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} data-testid="input-password" className="bg-background/50 focus-visible:ring-primary/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full font-mono font-semibold tracking-wide" disabled={loginMutation.isPending} data-testid="button-submit-login">
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AUTHENTICATING...</>
                ) : (
                  "AUTHENTICATE"
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Don't have clearance?{" "}
          <Link href="/register" className="text-primary hover:underline" data-testid="link-go-to-register">
            Request access
          </Link>
        </div>
      </div>
    </div>
  );
}
