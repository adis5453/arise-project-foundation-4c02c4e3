import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 2xl:max-w-[1400px] 2xl:px-10">
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
            className="inline-flex items-center gap-2 rounded-xl bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground shadow-denim-sm backdrop-blur hover:bg-card/70"
          >
            Log in
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-brand-primary-foreground shadow-denim-md transition hover:shadow-denim-hover"
          >
            Explore dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
