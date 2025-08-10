import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, RefreshControl } from "react-native";

export default function Transactions() {
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  console.log("Transactions loaded:", txns);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={txns}
        keyExtractor={(it: any, i: number) => it.transaction_id ?? String(i)}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        renderItem={({ item }: { item: any }) => (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontWeight: "600" }}>{item.name}</Text>
            <Text>{item.date}</Text>
            <Text style={{ marginTop: 4 }}>
              ${Number(item.amount).toFixed(2)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text>{loading ? "Loading…" : "No transactions yet."}</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </SafeAreaView>
  );
}
