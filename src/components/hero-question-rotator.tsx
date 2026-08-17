"use client";

import { useEffect, useState } from "react";

const EXAMPLE_QUESTIONS = [
  "이 사람과 잘 될까요?",
  "이직해도 될까요?",
  "지금이 맞는 시기일까요?",
  "왜 자꾸 같은 실수를 할까요?",
] as const;

export function HeroQuestionRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % EXAMPLE_QUESTIONS.length);
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);

  // Illustrative example text, not information the user needs announced on
  // every rotation, so this intentionally isn't an aria-live region.
  return (
    <p className="hero-question">
      <span className="hero-question-mark" aria-hidden="true">“</span>
      <span className="hero-question-text">{EXAMPLE_QUESTIONS[index]}</span>
    </p>
  );
}
