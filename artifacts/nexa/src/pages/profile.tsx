import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetUserProfile, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TerminalSquare, Activity, MessageSquare, Database, Clock, CreditCard } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetUserProfile({
    query: { queryKey: getGetUserProfileQueryKey() }
  });

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Operator Dossier</h1>
            <p className="text-sm text-muted-foreground font-mono">SYSTEM_RECORD_ID: {profile?.id || '---'}</p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48 w-full bg-card border border-white/5 rounded-xl" />
              <div className="grid md:grid-cols-2 gap-4">
                <Skeleton className="h-32 bg-card border border-white/5 rounded-xl" />
                <Skeleton className="h-32 bg-card border border-white/5 rounded-xl" />
              </div>
            </div>
          ) : profile ? (
            <>
              {/* Identity Card */}
              <div className="bg-card border border-white/5 rounded-xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 text-white/5 pointer-events-none">
                  <TerminalSquare size={120} />
                </div>
                
                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-2xl font-bold uppercase">
                    {profile.name.substring(0, 2)}
                  </div>
                  
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">{profile.name}</h2>
                    <div className="text-muted-foreground font-mono">{profile.email}</div>
                    <div className="pt-2 flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider ${
                        profile.plan === 'pro' 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'bg-white/10 text-white/70 border border-white/10'
                      }`}>
                        CLEARANCE: {profile.plan.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} /> Init: {format(new Date(profile.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <h3 className="text-sm font-mono tracking-widest text-muted-foreground uppercase pt-4">Telemetry_Data</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <StatCard 
                  icon={<Activity className="text-emerald-500" />}
                  title="Daily Utilization"
                  value={`${profile.dailyMessagesUsed} / ${profile.dailyLimit}`}
                  subtitle="Messages processed in current cycle"
                />
                
                <StatCard 
                  icon={<Database className="text-primary" />}
                  title="Total Operations"
                  value={profile.totalMessages.toString()}
                  subtitle="Lifetime messages executed"
                />
                
                <StatCard 
                  icon={<MessageSquare className="text-blue-500" />}
                  title="Session Count"
                  value={profile.totalConversations.toString()}
                  subtitle="Unique conversational vectors"
                />
                
                <StatCard 
                  icon={<CreditCard className="text-yellow-500" />}
                  title="Current Plan"
                  value={profile.plan.toUpperCase()}
                  subtitle="Active subscription tier"
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground font-mono">
              RECORD_NOT_FOUND
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, title, value, subtitle }: { icon: React.ReactNode, title: string, value: string, subtitle: string }) {
  return (
    <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 text-muted-foreground">
        {icon}
        <span className="font-mono text-sm tracking-widest uppercase">{title}</span>
      </div>
      <div>
        <div className="text-3xl font-bold font-mono tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
      </div>
    </div>
  );
}
