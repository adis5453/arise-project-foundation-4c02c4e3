import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import IsoLevelWarp from "@/components/ui/isometric-wave-grid-background";

export default function HeroDemo() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-border bg-background">
      {/* BACKGROUND */}
      <div className="absolute inset-0 opacity-70">
        <IsoLevelWarp className="h-full w-full" color="14, 165, 233" speed={1} density={42} />
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 sm:px-10">
        <div className="flex flex-col gap-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            <Sparkles className="h-4 w-4" />
            A modern HRM for teams that move fast
          </p>

          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            The Fabric of <span className="text-brand-primary">Digital Reality.</span>
          </h1>

          <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Time-off, attendance, org structure, and analytics—woven into one coherent system.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-brand-primary-foreground shadow-denim-md transition hover:shadow-denim-hover"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:bg-card"
          >
            Open dashboard
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4" />
              Org-ready
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Teams, roles, departments, approvals.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="h-4 w-4" />
              Secure by default
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Protected modules and role routing.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4" />
              Premium UI
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Glass, bento layouts, motion.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
