import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const HomeSecurity = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"section">>(
  function HomeSecurity(_props, ref) {
    return (
      <section ref={ref} id="security" className="mx-auto max-w-7xl px-6 py-20 2xl:max-w-[1400px] 2xl:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Security that feels invisible</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Guardrails are built in—role checks, account status enforcement, and audit-friendly workflows—without slowing teams down.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-medium text-brand-primary-foreground shadow-denim-md transition hover:shadow-denim-hover"
              >
                Log in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border/15 bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition hover:bg-card"
              >
                Explore dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border/15 bg-card/60 p-6 shadow-denim-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <ShieldCheck className="h-4 w-4 text-brand-accent" />
              Built-in governance
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Keep access tight and decisions traceable across modules.
            </p>

            <div className="mt-6 grid gap-3">
              {[
                "Role-based routing & protected modules",
                "Account status enforcement (inactive users blocked)",
                "Audit-friendly approvals and workflows",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/10 bg-background/60 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
);
