import React from "react";
import { BarChart3, CalendarClock, FileText, Shield, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Org & teams",
    desc: "Departments, teams, roles, and reporting lines.",
    span: "sm:col-span-2",
  },
  {
    icon: CalendarClock,
    title: "Time-off",
    desc: "Requests, approvals, balances, audits.",
    span: "sm:col-span-1",
  },
  {
    icon: FileText,
    title: "Documents",
    desc: "Employee docs with verification and expiry.",
    span: "sm:col-span-1",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Dashboards that adapt to each role.",
    span: "sm:col-span-1",
  },
  {
    icon: Shield,
    title: "Governance",
    desc: "Role checks, guarded modules, account status enforcement.",
    span: "sm:col-span-2",
  },
];

export function HomeFeatureBento() {
  return (
    <section id="features" className="relative bg-foreground text-background">
      {/* soft glow corners */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-primary/15 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 h-[28rem] w-[28rem] rounded-full bg-brand-accent/10 blur-3xl" />
      </div>

      {/* subtle gradient depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(900px 520px at 15% 0%, hsl(var(--ring) / 0.18) 0%, transparent 60%), radial-gradient(760px 520px at 90% 15%, hsl(var(--accent) / 0.14) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 pt-28 pb-20 lg:pb-28 2xl:max-w-[1400px] 2xl:px-10">
        <div className="grid items-start gap-14 lg:grid-cols-[0.92fr_1.08fr] xl:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="max-w-[18ch] text-balance text-4xl font-semibold tracking-tight text-background sm:text-5xl">
              Built for modern HR teams
            </h2>
            <p className="mt-4 max-w-md text-base text-background/75">
              A premium, glass-forward UI with the modules you need—without the clutter.
            </p>
          </div>

          {/* 21st.dev-inspired bento grid */}
          <div className="grid gap-4 sm:grid-cols-3 lg:mt-10 xl:mt-14">
            {FEATURES.map(({ icon: Icon, title, desc, span }) => (
              <div
                key={title}
                className={`group rounded-3xl border border-background/15 bg-muted/90 p-7 text-foreground shadow-denim-sm transition hover:bg-muted hover:shadow-denim-hover ${span}`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-secondary text-brand-secondary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold tracking-tight">{title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
                <div className="mt-5 h-px w-full bg-border/60" />
                <p className="mt-4 text-xs text-muted-foreground">
                  Designed to feel fast: clear hierarchy, bento layouts, and role-aware navigation.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
