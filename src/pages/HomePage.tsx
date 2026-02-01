import React from "react";
import { HomeFeatureBento } from "@/pages/home/HomeFeatureBento";
import { HomeFooter } from "@/pages/home/HomeFooter";
import { HomeHeader } from "@/pages/home/HomeHeader";
import { HomeHero } from "@/pages/home/HomeHero";
import { HomeModules } from "@/pages/home/HomeModules";
import { HomeSecurity } from "@/pages/home/HomeSecurity";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HomeHeader />
      <HomeHero />
      <HomeFeatureBento />
      <HomeModules />
      <HomeSecurity />
      <HomeFooter />
    </main>
  );
}
