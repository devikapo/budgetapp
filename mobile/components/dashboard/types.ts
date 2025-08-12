export type ViewFilter = {
  id: string;
  name: string;
  dateRange: { start?: Date; end?: Date };
  categories: string[];
  transactionType: "spending" | "income";
};
