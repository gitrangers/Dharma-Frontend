export type NewAwardDoc = {
  _id: string;
  name?: string;
  year?: string | number;
  movie?: string;
  award?: Array<{
    winner?: string;
    awardname?: string;
    note?: string;
  }>;
};
