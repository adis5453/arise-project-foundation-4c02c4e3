import React from "react";
import { CalendarClock, FileText, MessageSquare, Users } from "lucide-react";

const MODULES = [
  { icon: MessageSquare, label: "Messaging" },
  { icon: Users, label: "Employees" },
  { icon: CalendarClock, label: "Attendance" },
  { icon: FileText, label: "Documents" },
];

export const HomeModules = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"section">>(
  function HomeModules(props, ref) {
    return (
      <section ref={ref} id="modules" className="bg-card" {...props}>
        <div className="mx-auto max-w-7xl px-6 py-20 2xl:max-w-[1400px] 2xl:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Pick modules. Keep one source of truth.</h2>
              <p className="mt-3 text-muted-foreground">
                Start with essentials, then expand into payroll, performance, hiring, and analytics—without retooling.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {MODULES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl bg-background/55 px-4 py-3 shadow-denim-sm backdrop-blur"
                  >
                    <Icon className="h-4 w-4 text-brand-accent" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* A simple glass “stack” block to keep the 21st feel without external assets */}
            <div className="grid gap-4">
              <div className="rounded-3xl bg-background/55 p-6 shadow-denim-sm backdrop-blur">
                <h3 className="text-base font-semibold tracking-tight">Role-aware experiences</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  HR, managers, and employees see what matters—nothing else.
                </p>
              </div>
              <div className="rounded-3xl bg-background/55 p-6 shadow-denim-sm backdrop-blur">
                <h3 className="text-base font-semibold tracking-tight">Workflows that don’t break</h3>
                <p className="mt-2 text-sm text-muted-foreground">Approvals, escalations, audit trails, and balances built in.</p>
              </div>
              <div className="rounded-3xl bg-background/55 p-6 shadow-denim-sm backdrop-blur">
                <h3 className="text-base font-semibold tracking-tight">Fast to scan</h3>
                <p className="mt-2 text-sm text-muted-foreground">Bento layouts, clear hierarchy, and quick actions everywhere.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  },
);

HomeModules.displayName = "HomeModules";
