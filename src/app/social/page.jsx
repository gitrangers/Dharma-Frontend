import { SocialPageContent } from "@/components/social/SocialPageContent";

export const metadata = {
  title: "Social | Dharma Productions",
  description:
    "For those whose dharma is Dharma — entertainment, interaction, merchandise and more from the Dharma family.",
};

/** Legacy Angular `dharma-world` state at `/social`. */
export default function SocialPage() {
  return (
    <div className="min-vh-content social-page">
      <SocialPageContent />
    </div>
  );
}
