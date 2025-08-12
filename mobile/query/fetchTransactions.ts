export async function fetchTransactions(): Promise<any[]> {
  const res = await fetch("http://localhost:8000/api/transactions");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
