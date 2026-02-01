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
    <section id="features" className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Built for modern HR teams</h2>
          <p className="mt-3 text-muted-foreground">
            A premium, glass-forward UI with the modules you need—without the clutter.
          </p>
        </div>

        {/* 21st.dev-inspired bento grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, span }) => (
            <div
              key={title}
              className={`group rounded-3xl border border-border bg-card/70 p-6 shadow-denim-sm backdrop-blur transition hover:shadow-denim-hover ${span}`}
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
    </section>
  );
}
