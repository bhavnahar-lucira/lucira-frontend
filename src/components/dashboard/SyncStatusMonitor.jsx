"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Clock, Loader2, AlertCircle, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CRON_SCHEDULE = [
  { hour: 8, minute: 0, label: "8:00 AM IST" },
  { hour: 13, minute: 30, label: "1:30 PM IST" },
  { hour: 18, minute: 5, label: "6:05 PM IST" }
];

export default function SyncStatusMonitor() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [timeUntilNext, setTimeUntilNext] = useState("");
  const [loading, setLoading] = useState(true);
  const isProd = process.env.NODE_ENV === "production";

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/sync-status");
      const data = await res.json();
      setSyncStatus(data);
    } catch (e) {
      console.error("Failed to fetch sync status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Timer logic
  useEffect(() => {
    if (!isProd) return;

    const updateTimer = () => {
      const now = new Date();
      // IST is UTC+5:30
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffset);

      let nextRun = null;
      let minDiff = Infinity;

      CRON_SCHEDULE.forEach(schedule => {
        let runTime = new Date(istNow);
        runTime.setHours(schedule.hour, schedule.minute, 0, 0);

        if (runTime <= istNow) {
          runTime.setDate(runTime.getDate() + 1);
        }

        const diff = runTime - istNow;
        if (diff < minDiff) {
          minDiff = diff;
          nextRun = runTime;
        }
      });

      if (nextRun) {
        const diffMs = nextRun - istNow;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [isProd]);

  if (!isProd) return null;
  if (loading && !syncStatus) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const isSyncing = syncStatus?.status === "in_progress";

  return (
    <div className="space-y-6">
      {/* Next Cron Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Scheduled Sync</p>
                <p className="text-2xl font-bold tracking-tight">{timeUntilNext}</p>
              </div>
            </div>
            <div className="text-right">
                <Badge variant="outline" className="mb-1 border-primary/30">IST Schedule</Badge>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                    {CRON_SCHEDULE.map(s => <div key={s.label}>{s.label}</div>)}
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current/Last Sync Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">
            {isSyncing ? "Sync in Progress" : "Last Sync Result"}
          </CardTitle>
          <Badge variant={syncStatus?.status === "success" ? "success" : isSyncing ? "warning" : "destructive"}>
            {syncStatus?.status?.replace("_", " ").toUpperCase()}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncStatus?.steps?.map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {step.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {step.status === "running" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    {step.status === "pending" && <Clock className="w-4 h-4 text-muted-foreground" />}
                    {step.status === "failed" && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className="font-medium">{step.step}</span>
                  </div>
                  <span className="text-muted-foreground font-mono">{step.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                        step.status === "success" ? "bg-green-500" : 
                        step.status === "running" ? "bg-blue-500" : 
                        "bg-muted"
                    }`}
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
                {step.message && (
                  <p className="text-[10px] text-muted-foreground truncate italic pl-6">
                    {step.message}
                  </p>
                )}
              </div>
            ))}

            {!isSyncing && syncStatus?.startTime && (
              <div className="pt-4 border-t mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Started At</p>
                  <p>{new Date(syncStatus.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Ended At</p>
                  <p>{syncStatus.endTime ? new Date(syncStatus.endTime).toLocaleString() : "N/A"}</p>
                </div>
              </div>
            )}
            
            {syncStatus?.error && (
               <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p><strong>Error:</strong> {syncStatus.error}</p>
               </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
