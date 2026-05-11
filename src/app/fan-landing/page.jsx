import { FanLandingContent } from "@/components/fan/FanLandingContent";

export const metadata = {
  title: "Fan Corner | Dharma Productions",
  description: "Enter the Dharma fan corner — games and dictionary.",
};

/** Legacy Angular `fan-landing` state. */
export default function FanLandingPage() {
  return (
    <div className="min-vh-content">
      <FanLandingContent />
    </div>
  );
}
