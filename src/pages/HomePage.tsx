import React, { useEffect } from "react";
import { HomeFeatureBento } from "@/pages/home/HomeFeatureBento";
import { HomeFooter } from "@/pages/home/HomeFooter";
import { HomeHeader } from "@/pages/home/HomeHeader";
import { HomeHero } from "@/pages/home/HomeHero";
import { HomeModules } from "@/pages/home/HomeModules";
import { HomeSecurity } from "@/pages/home/HomeSecurity";

export default function HomePage() {
  // Paper-tone homepage, regardless of the app's global theme.
  useEffect(() => {
    const wasBodyDark = document.body.classList.contains("dark");
    const wasHtmlDark = document.documentElement.classList.contains("dark");

    const prevBodyBg = document.body.style.background;
    const prevBodyColor = document.body.style.color;
    const prevBodyBgImage = document.body.style.backgroundImage;

    document.body.classList.remove("dark");
    document.documentElement.classList.remove("dark");

    // Override MUI CssBaseline/body styles for this route.
    document.body.style.background = "hsl(var(--background))";
    document.body.style.color = "hsl(var(--foreground))";
    document.body.style.backgroundImage = "none";

    return () => {
      document.body.style.background = prevBodyBg;
      document.body.style.color = prevBodyColor;
      document.body.style.backgroundImage = prevBodyBgImage;

      if (wasBodyDark) document.body.classList.add("dark");
      if (wasHtmlDark) document.documentElement.classList.add("dark");
    };
  }, []);

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
