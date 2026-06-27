import { useEffect } from "react";
import confetti from "canvas-confetti";

interface CelebrationEffectProps {
  fire: boolean;
  onComplete: () => void;
}

export function CelebrationEffect({ fire, onComplete }: CelebrationEffectProps) {
  useEffect(() => {
    if (!fire) return;

    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#22c55e", "#3b82f6", "#eab308", "#f97316", "#ef4444", "#a855f7"];

    // Left side burst
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
      zIndex: 9999,
    });

    // Right side burst
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
      zIndex: 9999,
    });

    // Center burst
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors,
      zIndex: 9999,
    });

    // Continuous rain effect
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        onComplete();
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors,
        zIndex: 9999,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors,
        zIndex: 9999,
      });
    }, 150);

    return () => clearInterval(interval);
  }, [fire, onComplete]);

  return null;
}
