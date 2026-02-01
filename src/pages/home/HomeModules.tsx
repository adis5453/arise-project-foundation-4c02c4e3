import React from "react";
import { CalendarClock, FileText, MessageSquare, Users } from "lucide-react";

const MODULES = [
  { icon: MessageSquare, label: "Messaging" },
  { icon: Users, label: "Employees" },
  { icon: CalendarClock, label: "Attendance" },
  { icon: FileText, label: "Documents" },
];

export function HomeModules() {
  return (
    <section id="modules" className="border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">One system. Many modules.</h2>
            <p className="mt-3 text-muted-foreground">
              Start with essentials, then expand into projects, payroll, performance, hiring, and analytics.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {MODULES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3 backdrop-blur"
                >
                  <Icon className="h-4 w-4 text-brand-accent" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* A simple glass “stack” block to keep the 21st feel without external assets */}
          <div className="grid gap-4">
            <div className="rounded-3xl border border-border bg-background/70 p-6 shadow-denim-sm backdrop-blur">
              <h3 className="text-base font-semibold tracking-tight">Role-aware dashboards</h3>
              <p className="mt-2 text-sm text-muted-foreground">Each role gets the right tools—no noise.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/70 p-6 shadow-denim-sm backdrop-blur">
              <h3 className="text-base font-semibold tracking-tight">Built-in workflows</h3>
              <p className="mt-2 text-sm text-muted-foreground">Approvals, audits, and balances are first-class.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/70 p-6 shadow-denim-sm backdrop-blur">
              <h3 className="text-base font-semibold tracking-tight">Fast navigation</h3>
              <p className="mt-2 text-sm text-muted-foreground">Bento-grid patterns for quick scanning and action.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
