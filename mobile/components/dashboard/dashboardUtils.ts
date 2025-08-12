import { ViewFilter } from "./types";

export function formatCategory(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getPieData(view: ViewFilter, transactions: any[]) {
  const { dateRange, categories, transactionType } = view;
  const filtered = transactions.filter((t: any) => {
    const txDate = new Date(t.date);
    const inRange =
      (!dateRange?.start || txDate >= dateRange.start) &&
      (!dateRange?.end || txDate <= dateRange.end);
    const cat =
      t.personal_finance_category?.primary || t.category?.[0] || "Other";
    // Only include debits for spending, credits for income
    const isSpending = t.amount < 0;
    const isIncome = t.amount > 0;
    const typeMatch = transactionType === "spending" ? isSpending : isIncome;
    return inRange && categories.includes(cat) && typeMatch;
  });
  const group: { [cat: string]: number } = {};
  filtered.forEach((t: any) => {
    const cat =
      t.personal_finance_category?.primary || t.category?.[0] || "Other";
    group[cat] = (group[cat] || 0) + Math.abs(t.amount);
  });
  const colors = [
    "#4F8EF7",
    "#00C853",
    "#FF7043",
    "#AB47BC",
    "#29B6F6",
    "#FFA000",
  ];
  // Sort categories by value descending
  return Object.entries(group)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, value], i) => ({
      text: formatCategory(cat),
      value,
      color: colors[i % colors.length],
    }));
}

export function handleEdit(
  views: ViewFilter[],
  viewId: string,
  setEditingView: (v: ViewFilter | null) => void,
  setModalVisible: (v: boolean) => void
) {
  const view = views.find((v) => v.id === viewId);
  if (view) {
    setEditingView(view);
    setModalVisible(true);
  }
}

export function handleDelete(
  setViews: React.Dispatch<React.SetStateAction<ViewFilter[]>>,
  viewId: string,
  setMenuOpen: (v: string | null) => void
) {
  setViews((prev) => prev.filter((v) => v.id !== viewId));
  setMenuOpen(null);
}

export function handleSave(
  filter: {
    name: string;
    dateRange: { start?: Date; end?: Date };
    categories: string[];
    transactionType: "spending" | "income";
  },
  editingView: ViewFilter | null,
  setViews: React.Dispatch<React.SetStateAction<ViewFilter[]>>,
  setEditingView: (v: ViewFilter | null) => void,
  setModalVisible: (v: boolean) => void
) {
  if (editingView) {
    setViews((prev) =>
      prev.map((v) =>
        v.id === editingView.id ? ({ ...v, ...filter } as ViewFilter) : v
      )
    );
    setEditingView(null);
  } else {
    setViews((prev) => [
      {
        ...filter,
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      } as ViewFilter,
      ...prev,
    ]);
  }
  setModalVisible(false);
}
