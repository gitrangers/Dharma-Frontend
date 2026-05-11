import { FanCornerQuiz } from "@/components/fan/FanCornerQuiz";

export const metadata = {
  title: "Special Rapid Fire | Dharma Productions",
  description: "Dharma fan corner — Rapid Fire quiz.",
};

/** Legacy Angular `fan-corner` — registration modal + timed quiz (`rapidAnswer.js`). */
export default function FanCornerPage() {
  return (
    <div className="min-vh-content">
      <FanCornerQuiz />
    </div>
  );
}
