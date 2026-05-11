import DictionaryCards from "@/components/dictionary/DictionaryCards";
import { fetchDictionaryCards } from "@/lib/server/dictionary";

export const metadata = {
  title: "Dharma Dictionary | Dharma Productions",
  description: "Drama the Dharma way — words for your vocab.",
};

/** Data from Strapi `GET /api/dictionaries?populate=*` (server — see `lib/server/dictionary.js`). */
export default async function DictionaryPage() {
  const items = await fetchDictionaryCards();

  return (
    <section className="dictionary-page dark-bg2 min-vh-content">
      <div className="container">
        <div className="text-center text-white pb-3">
          <h1 className="super-big font-hammersmith text-up mb-2">Dharma Dictionary</h1>
          <p className="descriptive mb-0">
            If you&apos;re going to be dramatic, do it the Dharma way! Here&apos;s an update on all the words that need to
            make it to your vocab.
          </p>
        </div>
      </div>
      <section className="dictionary-page__grid-wrap mt-4">
        <div className="container">
          <DictionaryCards items={items} />
        </div>
      </section>
    </section>
  );
}
