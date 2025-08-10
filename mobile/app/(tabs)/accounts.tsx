import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Button,
  Text,
  SectionList,
  TouchableOpacity,
} from "react-native";
import {
  create,
  open,
  dismissLink,
  LinkIOSPresentationStyle,
  LinkLogLevel,
  usePlaidEmitter,
  LinkEvent,
} from "react-native-plaid-link-sdk";

type ItemSection = {
  title: string;
  item_id: string;
  data: any[];
};

export default function Accounts() {
  const [busy, setBusy] = useState(false);
  const [sections, setSections] = useState<ItemSection[]>([]);
  usePlaidEmitter((e: LinkEvent) => console.log("PLAID EVENT:", e));

  const load = async () => {
    const r = await fetch("http://localhost:8000/api/items-with-accounts");
    const items = await r.json();
    const mapped: ItemSection[] = (items || []).map((it: any) => ({
      title: it.institution_name || "Institution",
      item_id: it.item_id,
      data: it.accounts || [],
    }));
    setSections(mapped);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("http://localhost:8000/api/link-token", {
        method: "POST",
      });
      const d = await r.json();
      const token = d?.link_token;
      if (!token) throw new Error("no link_token");
      dismissLink();
      create({ token, noLoadingState: false });
      open({
        iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
        logLevel: LinkLogLevel.ERROR,
        onSuccess: async (success) => {
          await fetch("http://localhost:8000/api/exchange-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_token: success.publicToken }),
          });
          await load();
          setBusy(false);
        },
        onExit: () => setBusy(false),
      });
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  const unlink = async (item_id: string) => {
    await fetch(`http://localhost:8000/api/items/${item_id}`, {
      method: "DELETE",
    });
    await load();
  };

  const Header = (
    <View style={{ padding: 16 }}>
      <Button
        title={busy ? "Working…" : "Add Account"}
        onPress={handleAdd}
        disabled={busy}
      />
      <View style={{ height: 12 }} />
      <Button title="Refresh" onPress={load} />
      <View style={{ height: 12 }} />
      <Text style={{ fontWeight: "600" }}>
        {sections.length ? "Linked Institutions" : "No accounts yet."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.account_id ?? String(index)}
        ListHeaderComponent={Header}
        renderSectionHeader={({ section }) => (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: "#fafafa",
              borderTopWidth: 1,
              borderColor: "#eee",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontWeight: "700" }}>{section.title}</Text>
            <TouchableOpacity
              onPress={() => unlink(section.item_id)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: "#eee",
              }}
            >
              <Text>Unlink</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {item.name || item.official_name || "Account"}
            </Text>
            <Text>
              {item.subtype || ""} {item.mask ? `••••${item.mask}` : ""}
            </Text>
            <Text>
              {item.balances?.available != null
                ? `$${item.balances.available}`
                : ""}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 50 }}
        stickySectionHeadersEnabled
      />
    </SafeAreaView>
  );
}
