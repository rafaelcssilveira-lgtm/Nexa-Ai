import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BrainCircuit, Zap, Shield, ChevronRight, TerminalSquare } from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/5 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <TerminalSquare size={18} />
          </div>
          <span className="font-mono font-bold tracking-tight text-lg">NEXA</span>
        </div>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link href="/chat">
              <Button data-testid="link-go-to-chat" className="font-mono text-xs">LAUNCH_CONSOLE</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" data-testid="link-login" className="font-mono text-xs text-muted-foreground hover:text-foreground">LOGIN</Button>
              </Link>
              <Link href="/register">
                <Button data-testid="link-register" className="font-mono text-xs">INITIALIZE</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary font-mono mb-4">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              NEXA_CORE_v2.0_ONLINE
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight font-sans">
              Precision Intelligence.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Zero Friction.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A high-performance cognitive instrument designed for professionals. Fast, deterministic, and relentlessly focused on the output.
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isAuthenticated ? "/chat" : "/register"}>
                <Button size="lg" className="h-14 px-8 text-base font-mono gap-2" data-testid="button-hero-cta">
                  ENGAGE_SYSTEM <ChevronRight size={18} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 border-t border-white/5 bg-muted/20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Zap className="text-yellow-500" />}
              title="Low Latency Response"
              description="Built on a highly optimized edge architecture. Responses stream in milliseconds, keeping you in the flow."
            />
            <FeatureCard 
              icon={<BrainCircuit className="text-primary" />}
              title="Advanced Context"
              description="Maintains deep conversational memory over long sessions. It remembers so you don't have to."
            />
            <FeatureCard 
              icon={<Shield className="text-emerald-500" />}
              title="Absolute Privacy"
              description="Your conversations are encrypted and isolated. We don't train on your data. Your intelligence remains yours."
            />
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-white/5 font-mono">
        &copy; {new Date().getFullYear()} NEXA SYSTEMS. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border border-white/5 mb-6">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
