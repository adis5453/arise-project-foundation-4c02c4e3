import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import IsoLevelWarp from "@/components/ui/isometric-wave-grid-background";
import { HomeProductPreview } from "@/pages/home/HomeProductPreview";

const HIGHLIGHTS = [
  "Role-based routing & approvals",
  "Attendance + location support",
  "Leave workflows + balances",
  "Projects, payroll, and more",
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Paper-tone lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 34px, hsl(var(--muted)) 35px)",
          opacity: 0.65,
        }}
      />

      {/* Subtle depth layer */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <IsoLevelWarp className="h-full w-full" color="14, 165, 233" speed={0.6} density={56} />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-14 sm:pb-20 sm:pt-16 2xl:max-w-[1400px] 2xl:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] xl:grid-cols-[1.1fr_0.9fr]">
          <div className="relative">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-denim-sm backdrop-blur">
              Built for teams that move fast
            </p>

            <h1 className="mt-5 max-w-[18ch] text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Your workstream, team, and time-off—one place.
            </h1>

            <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              arise hrm blends attendance, leave, documents, messaging, and analytics into a single, role-aware experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-medium text-brand-primary-foreground shadow-denim-md transition hover:shadow-denim-hover"
              >
                Log in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition hover:bg-card"
              >
                Open dashboard
              </Link>
            </div>

            <ul className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[560px] lg:mx-0 lg:justify-self-end xl:max-w-[620px]">
            <HomeProductPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
