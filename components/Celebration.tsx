"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const LINES = [
  "Done. That one's on the record now.",
  "Logged. Future-you will thank you.",
  "Good work — struck off the list.",
  "That's one more thing you actually finished.",
  "Filed under: things I followed through on.",
  "Nicely done.",
];

export default function Celebration({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!message) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    confetti({
      particleCount: 70,
      spread: 65,
      startVelocity: 35,
      gravity: 1.1,
      origin: { y: 0.7 },
      colors: ["#A9812F", "#3F5C46", "#202B36"],
      disableForReducedMotion: true,
    });

    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-paper px-5 py-3 text-sm shadow-lg z-50"
    >
      {message}
    </div>
  );
}

export function pickCelebrationLine(): string {
  return LINES[Math.floor(Math.random() * LINES.length)];
}
