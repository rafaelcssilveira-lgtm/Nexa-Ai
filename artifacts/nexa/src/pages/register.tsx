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
import { TerminalSquare, Loader2 } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

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
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Initialization complete", description: "Welcome to Nexa." });
        setLocation("/chat");
      },
      onError: (error) => {
        const msg = (error as { data?: { error?: string } })?.data?.error;
        toast({ 
          title: "Initialization failed", 
          description: msg || "An error occurred during registration.", 
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
            <h1 className="text-2xl font-bold tracking-tight">Initialize Operator</h1>
            <p className="text-sm text-muted-foreground mt-2">Create your Nexa system profile</p>
          </div>
        </div>

        <div className="p-8 border border-white/10 rounded-xl bg-card shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Operator Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-name" className="bg-background/50 focus-visible:ring-primary/50" />
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
                    <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Encryption Key (Password)</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} data-testid="input-password" className="bg-background/50 focus-visible:ring-primary/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full font-mono font-semibold tracking-wide" disabled={registerMutation.isPending} data-testid="button-submit-register">
                {registerMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> INITIALIZING...</>
                ) : (
                  "INITIALIZE"
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Already have clearance?{" "}
          <Link href="/login" className="text-primary hover:underline" data-testid="link-go-to-login">
            Access console
          </Link>
        </div>
      </div>
    </div>
  );
}
