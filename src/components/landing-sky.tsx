import { SKY_NARROW, SKY_WIDE } from "./landing-sky-data";

// Stars belong to neither tarot nor saju, so the hero can hold one question without picking a side.
// Both drawings ship; CSS shows the one drawn for the current width.
export function LandingSky() {
  return (
    <div aria-hidden="true" className="landing-sky">
      {/* Constant markup generated from the design canvas, never user input. */}
      <div className="landing-sky-wide" dangerouslySetInnerHTML={{ __html: SKY_WIDE }} />
      <div className="landing-sky-narrow" dangerouslySetInnerHTML={{ __html: SKY_NARROW }} />
    </div>
  );
}
