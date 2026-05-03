import { HomePageContent } from "@/components/home/HomePageContent";
import { loadHomePageData } from "@/lib/server/dharmaNodeHome";

export default async function Home() {
  const data = await loadHomePageData();

  return <HomePageContent {...data} />;
}
