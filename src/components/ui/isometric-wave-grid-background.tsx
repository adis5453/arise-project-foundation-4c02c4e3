import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface IsoLevelWarpProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Primary line color in RGB string form: "r, g, b".
   * Default matches a sky/cyan accent.
   */
  color?: string;
  /** Animation speed multiplier. */
  speed?: number;
  /** Grid density. Lower = larger cells. */
  density?: number;
}

const IsoLevelWarp = ({
  className,
  color = "14, 165, 233",
  speed = 1,
  density = 40,
  ...props
}: IsoLevelWarpProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    // Mouse Interaction
    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    // Wave Physics
    let time = 0;

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    const smoothMix = (a: number, b: number, t: number) => a + (b - a) * t;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      mouse.x = smoothMix(mouse.x, mouse.targetX, 0.1);
      mouse.y = smoothMix(mouse.y, mouse.targetY, 0.1);

      time += 0.01 * speed;

      // Grid Configuration (computed per frame so density changes are instant)
      const gridGap = Math.max(12, density);
      const rows = Math.ceil(height / gridGap) + 5;
      const cols = Math.ceil(width / gridGap) + 5;

      ctx.beginPath();

      for (let y = 0; y <= rows; y++) {
        let isFirst = true;

        for (let x = 0; x <= cols; x++) {
          const baseX = x * gridGap - gridGap * 2;
          const baseY = y * gridGap - gridGap * 2;

          // Ambient wave
          const wave =
            Math.sin(x * 0.2 + time) * Math.cos(y * 0.2 + time) * 15;

          // Mouse repulsion
          const dx = baseX - mouse.x;
          const dy = baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 300;
          const force = Math.max(0, (maxDist - dist) / maxDist);
          const interactionY = -(force * force) * 80;

          const finalX = baseX;
          const finalY = baseY + wave + interactionY;

          if (isFirst) {
            ctx.moveTo(finalX, finalY);
            isFirst = false;
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }
      }

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `rgba(${color}, 0)`);
      gradient.addColorStop(0.5, `rgba(${color}, 0.5)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = window.requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed, density]);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      {/* Optional: Vignette overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.65) 100%)",
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default IsoLevelWarp;
