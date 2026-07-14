export type Audience = "idiotes" | "epixiriseis";
export type Category = "ochimata" | "podilata";

export interface Record {
  scrapedAt: string;
  sourceUpdated: string;
  audience: Audience;
  category: Category;
  budget: number;
  available: number;
}

export interface WriteOptions {
  path: string;
}

export interface Writer {
  write(records: Record[], opts: WriteOptions): Promise<void>;
}

export interface Item {
  idPrefix: string;
  audience: Audience;
  category: Category;
}

export const ITEMS: Item[] = [
  { idPrefix: "totalIdiotesCar", audience: "idiotes", category: "ochimata" },
  { idPrefix: "totalIdiotesBike", audience: "idiotes", category: "podilata" },
  { idPrefix: "totalEpixiriseisCar", audience: "epixiriseis", category: "ochimata" },
  { idPrefix: "totalEpixiriseisBike", audience: "epixiriseis", category: "podilata" },
];
