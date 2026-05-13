export type NewsDoc = {
  _id: string;
  /** CMS slug for `/news-events/[slug]` when present. */
  slug?: string;
  image?: string;
  banner?: string;
  title?: string;
  keywords?: string;
  date?: Date;
  text?: string;
  link?: string;
  movie?: string;
  order?: number;
};
