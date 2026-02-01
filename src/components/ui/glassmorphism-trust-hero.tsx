import React from "react";
import {
  ArrowRight,
  Play,
  Target,
  Crown,
  Star,
  // Brand Icons
  Hexagon,
  Triangle,
  Command,
  Ghost,
  Gem,
  Cpu,
} from "lucide-react";

// --- MOCK BRANDS ---
// Replaced PNGs with Lucide icons to simulate tech logos
const CLIENTS = [
  { name: "Acme Corp", icon: Hexagon },
  { name: "Quantum", icon: Triangle },
  { name: "Command+Z", icon: Command },
  { name: "Phantom", icon: Ghost },
  { name: "Ruby", icon: Gem },
  { name: "Chipset", icon: Cpu },
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=80";

// --- SUB-COMPONENTS ---
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
    <div className="text-2xl font-semibold tracking-tight text-foreground">
      {value}
    </div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

// --- MAIN COMPONENT ---
export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border bg-background">
      {/* Background Image with Gradient Mask */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Team collaborating"
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, hsl(var(--background) / 0.88) 0%, hsl(var(--background) / 0.72) 40%, hsl(var(--background) / 0.35) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 sm:px-10 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* --- LEFT COLUMN --- */}
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div className="animate-fade-in [animation-delay:100ms]">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-brand-accent-foreground">
                  <Crown className="h-4 w-4" />
                </span>
                <span className="font-medium text-foreground">Award-Winning Design</span>
              </div>
            </div>

            {/* Heading */}
            <div className="animate-fade-in [animation-delay:200ms]">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
                Crafting Digital{" "}
                <span className="text-brand-primary">Experiences</span> That Matter
              </h1>
            </div>

            {/* Description */}
            <div className="animate-fade-in [animation-delay:300ms]">
              <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                We design interfaces that combine beauty with functionality,
                creating seamless experiences that users love and businesses thrive
                on.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 animate-fade-in [animation-delay:400ms]">
              <button className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-brand-primary-foreground shadow-denim-md transition hover:shadow-denim-hover">
                View Portfolio <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:bg-card">
                <Play className="h-4 w-4" />
                Watch Showreel
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="flex flex-col gap-6">
            {/* Stats Card */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-6 backdrop-blur shadow-denim-sm animate-fade-in [animation-delay:300ms]">
              {/* subtle glow ring */}
              <div
                className="pointer-events-none absolute -inset-24 opacity-40"
                style={{
                  background:
                    "radial-gradient(closest-side, hsl(var(--primary) / 0.35), transparent)",
                }}
                aria-hidden="true"
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-5xl font-semibold tracking-tight text-foreground">
                      150+
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">Projects Delivered</div>
                  </div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary text-brand-secondary-foreground">
                    <Target className="h-5 w-5" />
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Client Satisfaction</span>
                    <span className="font-medium text-foreground">98%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[98%] bg-brand-primary" />
                  </div>
                </div>

                {/* Mini Stats Grid */}
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <StatItem value="24h" label="Avg. turnaround" />
                  <StatItem value="4.9" label="Avg. rating" />
                  <StatItem value="12" label="Core specialists" />
                </div>

                {/* Tag Pills */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-brand-accent" />
                    ACTIVE
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                    <Star className="h-3 w-3 text-brand-accent" />
                    PREMIUM
                  </span>
                </div>
              </div>
            </div>

            {/* Marquee Card */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur shadow-denim-sm animate-fade-in [animation-delay:500ms]">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="text-sm font-medium text-foreground">Trusted by Industry Leaders</div>
              </div>

              <div className="relative border-t border-border">
                <div className="flex w-[200%] items-center gap-6 px-6 py-5 animate-marquee">
                  {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((client, i) => {
                    const Icon = client.icon;
                    return (
                      <div
                        key={`${client.name}-${i}`}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3"
                      >
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-secondary text-brand-secondary-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-foreground">{client.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
