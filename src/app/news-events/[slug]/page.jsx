import { notFound } from "next/navigation";
import { NewsArticleView } from "@/components/news/NewsArticleView";
import { fetchNewsDetailPage } from "@/lib/server/newsDetail";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await fetchNewsDetailPage(slug);
  const title = data?.article?.title?.trim();
  if (!title) {
    return { title: "News | Dharma Productions" };
  }
  return { title: `${title} | Dharma Productions` };
}

export default async function NewsArticlePage({ params }) {
  const { slug } = await params;
  const data = await fetchNewsDetailPage(slug);
  if (!data?.article?._id) notFound();

  return (
    <NewsArticleView article={data.article} related={data.related} />
  );
}
