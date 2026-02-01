import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react";
import IsoLevelWarp from "@/components/ui/isometric-wave-grid-background";
import HeroDemo from "@/components/ui/isometric-wave-grid-background.demo";

const STOCK_1 =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80";
const STOCK_2 =
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1600&q=80";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary text-brand-primary-foreground shadow-denim-sm">
              A
            </span>
            arise hrm
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="hover:text-foreground" href="#features">
              Features
            </a>
            <a className="hover:text-foreground" href="#modules">
              Modules
            </a>
            <a className="hover:text-foreground" href="#security">
              Security
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-card/80"
            >
              Log in
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground shadow-denim-md transition hover:shadow-denim-hover"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <IsoLevelWarp className="h-full w-full" color="14, 165, 233" speed={0.8} density={48} />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative">
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
                Your workstream, team, and time-off—one place.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
                arise hrm is a modern HRM that blends attendance, leave, documents, messaging, and analytics into a single, role-aware experience.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-brand-primary-foreground shadow-denim-md transition hover:shadow-denim-hover"
                >
                  Log in
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-card/80"
                >
                  Open dashboard
                </Link>
              </div>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Role-based routing & approvals",
                  "Attendance + location support",
                  "Leave workflows + balances",
                  "Projects, payroll, and more",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card/60 p-3 backdrop-blur">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Built for modern HR teams</h2>
            <p className="mt-3 text-muted-foreground">
              A premium, glass-forward UI with the modules you need—without the clutter.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[{
              icon: Users,
              title: "Org & teams",
              desc: "Departments, teams, roles, and reporting lines.",
            },{
              icon: CalendarClock,
              title: "Time-off",
              desc: "Requests, approvals, balances, audits.",
            },{
              icon: FileText,
              title: "Documents",
              desc: "Employee docs with verification and expiry.",
            },{
              icon: BarChart3,
              title: "Analytics",
              desc: "Dashboards that adapt to each role.",
            }].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-3xl border border-border bg-card p-6 shadow-denim-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-secondary text-brand-secondary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2">
          <div className="rounded-3xl overflow-hidden border border-border">
            <img
              src={STOCK_1}
              alt="A team collaborating around a table"
              loading="lazy"
              className="h-72 w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-semibold tracking-tight">One system. Many modules.</h2>
            <p className="mt-3 text-muted-foreground">
              Start with the essentials, then expand into projects, payroll, performance, hiring, and messaging.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: MessageSquare, label: "Messaging" },
                { icon: Users, label: "Employees" },
                { icon: CalendarClock, label: "Attendance" },
                { icon: FileText, label: "Documents" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                  <Icon className="h-4 w-4 text-brand-accent" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Security & governance</h2>
            <p className="mt-3 text-muted-foreground">
              Role-based access, account status checks, and guarded modules are built into the experience.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-brand-primary-foreground shadow-denim-md transition hover:shadow-denim-hover"
              >
                Log in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-card/80"
              >
                Open dashboard
              </Link>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-border">
            <img
              src={STOCK_2}
              alt="A meeting with notes and laptops"
              loading="lazy"
              className="h-full min-h-72 w-full object-cover"
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} arise hrm</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" to="/login">
              Login
            </Link>
            <Link className="hover:text-foreground" to="/dashboard">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
