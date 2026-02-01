import React, { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export interface TextBlockAnimationProps {
  children: React.ReactNode;
  /** If true, animation triggers when the block scrolls into view. */
  animateOnScroll?: boolean;
  /** Delay (seconds). */
  delay?: number;
  /**
   * Revealer color. Use any valid CSS color.
   * Default uses semantic token via HSL.
   */
  blockColor?: string;
  /** Stagger between lines (seconds). */
  stagger?: number;
  /** Duration per phase (seconds). */
  duration?: number;
  className?: string;
}

/**
 * Splits text into "lines" by measuring word positions.
 * This is a lightweight fallback to avoid relying on GSAP's paid SplitText plugin.
 */
function splitIntoMeasuredLines(el: HTMLElement) {
  const original = el.innerHTML;

  // Only split plain text-ish content; if complex, we still attempt but may be imperfect.
  const text = el.textContent ?? "";
  el.innerHTML = "";

  const words = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  const wordSpans: HTMLSpanElement[] = [];
  const wordWrap = document.createElement("div");
  wordWrap.style.display = "inline";

  words.forEach((w, idx) => {
    const span = document.createElement("span");
    span.textContent = idx === words.length - 1 ? w : `${w} `;
    span.style.display = "inline";
    wordWrap.appendChild(span);
    wordSpans.push(span);
  });

  el.appendChild(wordWrap);

  // Measure lines by top position
  const lines: HTMLSpanElement[][] = [];
  let currentTop: number | null = null;
  wordSpans.forEach((span) => {
    const rect = span.getBoundingClientRect();
    const top = Math.round(rect.top);
    if (currentTop === null || Math.abs(top - currentTop) > 2) {
      lines.push([span]);
      currentTop = top;
    } else {
      lines[lines.length - 1].push(span);
    }
  });

  // Rebuild DOM: each line in wrapper, plus revealer block.
  el.innerHTML = "";
  const lineEls: HTMLDivElement[] = [];
  const blockEls: HTMLDivElement[] = [];

  lines.forEach((lineWords) => {
    const wrapper = document.createElement("div");
    wrapper.className = "block-line-parent";
    wrapper.style.position = "relative";
    wrapper.style.display = "block";
    wrapper.style.overflow = "hidden";

    const line = document.createElement("div");
    line.style.position = "relative";
    line.style.display = "inline";

    lineWords.forEach((w) => line.appendChild(w));

    const block = document.createElement("div");
    block.style.position = "absolute";
    block.style.top = "0";
    block.style.left = "0";
    block.style.width = "100%";
    block.style.height = "100%";
    block.style.zIndex = "2";
    block.style.transform = "scaleX(0)";
    block.style.transformOrigin = "left center";

    wrapper.appendChild(line);
    wrapper.appendChild(block);
    el.appendChild(wrapper);

    gsap.set(line, { opacity: 0 });
    lineEls.push(line);
    blockEls.push(block);
  });

  return {
    cleanup: () => {
      el.innerHTML = original;
    },
    lines: lineEls,
    blocks: blockEls,
  };
}

export default function TextBlockAnimation({
  children,
  animateOnScroll = true,
  delay = 0,
  blockColor = "hsl(var(--foreground))",
  stagger = 0.1,
  duration = 0.6,
  className,
}: TextBlockAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const deps = useMemo(
    () => ({ animateOnScroll, delay, blockColor, stagger, duration }),
    [animateOnScroll, delay, blockColor, stagger, duration],
  );

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const { lines, blocks, cleanup } = splitIntoMeasuredLines(el);
      blocks.forEach((b) => (b.style.backgroundColor = blockColor));

      const tl = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        delay,
        scrollTrigger: animateOnScroll
          ? {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            }
          : undefined,
      });

      tl.to(blocks, {
        scaleX: 1,
        duration,
        stagger,
        transformOrigin: "left center",
      })
        .set(
          lines,
          {
            opacity: 1,
            stagger,
          },
          `<${duration / 2}`,
        )
        .to(
          blocks,
          {
            scaleX: 0,
            duration,
            stagger,
            transformOrigin: "right center",
          },
          `<${duration * 0.4}`,
        );

      return () => {
        tl.kill();
        cleanup();
      };
    },
    { scope: containerRef, dependencies: [deps] },
  );

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      {children}
    </div>
  );
}
