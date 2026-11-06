import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: "petal" | "heart" | "gold";
}

export default function PetalAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const dim = {
      width: (canvas.width = window.innerWidth),
      height: (canvas.height = window.innerHeight),
    };

    const handleResize = () => {
      if (!canvas) return;
      dim.width = canvas.width = window.innerWidth;
      dim.height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const petalsCount = Math.min(Math.floor(dim.width / 50), 24);
    const petals: Petal[] = [];

    for (let i = 0; i < petalsCount; i++) {
      petals.push({
        x: Math.random() * dim.width,
        y: Math.random() * dim.height,
        size: Math.random() * 10 + 8,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 1.2 + 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.5 + 0.3,
        type: i % 4 === 0 ? "heart" : i % 3 === 0 ? "gold" : "petal",
      });
    }

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      if (p.type === "gold") {
        ctx.fillStyle = "#E5C07B";
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "heart") {
        ctx.fillStyle = "#E06D7A";
        const h = p.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, h / 4);
        ctx.bezierCurveTo(0, -h / 2, -h, -h / 2, -h, h / 4);
        ctx.bezierCurveTo(-h, h, 0, h * 1.3, 0, h * 1.5);
        ctx.bezierCurveTo(0, h * 1.3, h, h, h, h / 4);
        ctx.bezierCurveTo(h, -h / 2, 0, -h / 2, 0, h / 4);
        ctx.fill();
      } else {
        // Soft pink petal
        ctx.fillStyle = "#F7C5CC";
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.6, p.size, Math.PI / 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, dim.width, dim.height);

      petals.forEach((p) => {
        p.x += p.speedX + Math.sin(p.y * 0.005) * 0.5;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > dim.height + 20) {
          p.y = -20;
          p.x = Math.random() * dim.width;
        }
        if (p.x > dim.width + 20) p.x = -20;
        if (p.x < -20) p.x = dim.width + 20;

        drawPetal(p);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="petals-canvas" />;
}
