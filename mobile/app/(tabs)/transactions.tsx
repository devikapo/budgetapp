import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { formatCategory } from "../../components/dashboard/dashboardUtils";

const formatDateHeader = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function Transactions() {
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("http://localhost:8000/api/transactions");
      const d = await r.json();
      setTxns(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Unique categories for filter
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    txns.forEach(
      (t) => t.category && t.category.forEach((c: string) => cats.add(c))
    );
    txns.forEach((t) => {
      if (t.personal_finance_category && t.personal_finance_category.primary) {
        cats.add(t.personal_finance_category.primary);
      }
    });
    return Array.from(cats);
  }, [txns]);

  // Filtered transactions
  const filteredTxns = React.useMemo(() => {
    if (!selectedCategory) return txns;
    return txns.filter(
      (t) =>
        (t.category && t.category.includes(selectedCategory)) ||
        (t.personal_finance_category &&
          t.personal_finance_category.primary === selectedCategory)
    );
  }, [txns, selectedCategory]);

  // Group transactions by date
  const groupedTxns = React.useMemo(() => {
    const groups: { [date: string]: any[] } = {};
    filteredTxns.forEach((txn) => {
      const date = txn.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(txn);
    });
    // Sort by date descending
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTxns]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={groupedTxns}
        keyExtractor={([date], i) => date + i}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        renderItem={({ item: [date, txns] }) => (
          <View>
            {/* Date header with line */}
            <View>
              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 15,
                    backgroundColor: "#dee2e6",
                    width: "100%",
                    color: "#212529",
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                  }}
                >
                  {formatDateHeader(date)}
                </Text>
              </View>
            </View>
            {/* Transactions for this date */}
            {txns.map((item: any, idx: number) => (
              <View
                key={item.transaction_id ?? idx}
                style={{
                  width: "100%",
                  borderBottomWidth: idx === txns.length - 1 ? 0 : 1,
                  borderColor: "#f8f9fa",
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#212529" }}>
                    {item.name}
                  </Text>
                  <Text>${Number(item.amount).toFixed(2)}</Text>
                </View>
                {/* Show categories if available */}
                {item.personal_finance_category?.primary ||
                (item.category && item.category.length > 0) ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                    }}
                  >
                    {item.personal_finance_category?.primary && (
                      <Text
                        style={{
                          backgroundColor: "#E3F2FD",
                          color: "#1976D2",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        {formatCategory(item.personal_finance_category.primary)}
                      </Text>
                    )}
                    {item.category &&
                      item.category.map((cat: string, idx: number) => (
                        <Text
                          key={cat + idx}
                          style={{
                            backgroundColor: "#F3E5F5",
                            color: "#6A1B9A",
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        >
                          {formatCategory(cat)}
                        </Text>
                      ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
        ListHeaderComponent={
          categories.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 10,
              }}
            >
              <Text style={{ fontWeight: "600" }}>Category:</Text>
              <FlatList
                data={["All", ...categories]}
                horizontal
                keyExtractor={(c) => c}
                renderItem={({ item }) => (
                  <Text
                    onPress={() =>
                      setSelectedCategory(item === "All" ? null : item)
                    }
                    style={{
                      // backgroundColor:
                      //   selectedCategory === item ? "#4F8EF7" : "#f0f0f0",
                      color: selectedCategory === item ? "#1976D2" : "#212529",
                      borderRadius: 8,
                      fontSize: 14,
                      overflow: "hidden",
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                    }}
                  >
                    {item === "All" ? "All" : formatCategory(item)}
                  </Text>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View>
            <Text>{loading ? "Loading…" : "No transactions yet."}</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </SafeAreaView>
  );
}
