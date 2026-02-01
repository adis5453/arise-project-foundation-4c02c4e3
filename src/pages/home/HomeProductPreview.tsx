import React from "react";
import { CalendarClock, FileText, MapPin, MessageSquare, Users } from "lucide-react";

const STATS = [
  { icon: Users, label: "Employees", value: "128" },
  { icon: CalendarClock, label: "On time", value: "96%" },
  { icon: MessageSquare, label: "Messages", value: "24" },
];

const QUEUE = [
  { title: "Leave request", meta: "2 pending approvals" },
  { title: "Clock-in anomaly", meta: "1 flagged location" },
  { title: "Document expiry", meta: "3 documents this week" },
];

export function HomeProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-b from-white/20 to-transparent blur-2xl" />
      <div className="relative rounded-[2.2rem] border border-border bg-card/70 p-3 shadow-denim-lg backdrop-blur">
        <div className="rounded-[1.9rem] border border-border bg-background/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Dashboard preview</p>
              <p className="mt-1 text-sm font-semibold tracking-tight">Today at a glance</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Location-aware
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-border bg-card/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Icon className="h-4 w-4 text-brand-accent" />
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold tracking-tight">Approvals queue</p>
                <span className="text-xs text-muted-foreground">Last 24h</span>
              </div>
              <div className="mt-3 grid gap-2">
                {QUEUE.map((item) => (
                  <div key={item.title} className="rounded-xl border border-border bg-background/70 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span className="text-xs text-muted-foreground">{item.meta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                  <FileText className="h-4 w-4 text-brand-accent" />
                  Documents
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Verification + expiry tracking, built in.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                  <CalendarClock className="h-4 w-4 text-brand-accent" />
                  Time-off
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Balances, approvals, and audit trails.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
