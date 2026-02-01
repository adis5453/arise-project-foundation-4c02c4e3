import React from "react";
import { ArrowDown } from "lucide-react";
import TextBlockAnimation from "@/components/ui/text-block-animation";

export default function DemoOne() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* 1. HERO SECTION */}
        <section className="space-y-6">
          <TextBlockAnimation>
            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
              Don&apos;t just inform. <span className="text-brand-primary">Captivate.</span>
            </h1>
          </TextBlockAnimation>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDown className="h-4 w-4" />
            Scroll to Reveal
          </div>
        </section>

        {/* 2. THE PITCH */}
        <section className="mt-16 grid gap-6">
          <TextBlockAnimation>
            <h2 className="text-3xl font-semibold tracking-tight">This is what I do.</h2>
          </TextBlockAnimation>

          <TextBlockAnimation blockColor="hsl(var(--primary))">
            <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              You stopped scrolling because the motion caught your eye. That&apos;s the
              power of GSAP and React properly combined. I build bespoke animations
              like this for clients who aren&apos;t satisfied with “standard.”
            </p>
          </TextBlockAnimation>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-denim-sm">
            <TextBlockAnimation blockColor="hsl(var(--accent))">
              <p className="text-xl font-medium tracking-tight">
                “If you want your website to feel alive, we should talk.”
              </p>
            </TextBlockAnimation>
          </div>
        </section>

        {/* 3. FOOTER CTA */}
        <footer className="mt-20 border-t border-border pt-10">
          <TextBlockAnimation blockColor="hsl(var(--foreground))">
            <a
              href="https://daiwiik.com"
              className="story-link text-4xl font-black tracking-tight transition-colors sm:text-6xl lg:text-7xl"
              target="_blank"
              rel="noreferrer"
            >
              Let&apos;s Build It.
            </a>
          </TextBlockAnimation>
        </footer>
      </div>
    </div>
  );
}
