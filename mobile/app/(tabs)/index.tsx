import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import DashboardModal from "../../components/dashboard/DashboardModal";
import DashboardEmptyState from "../../components/dashboard/DashboardEmptyState";
import DashboardViewsList from "../../components/dashboard/DashboardViewsList";
import { ViewFilter } from "../../components/dashboard/types";
import { fetchTransactions } from "../../query/fetchTransactions";
import { getPieData } from "../../components/dashboard/dashboardUtils";
import {
  handleEdit,
  handleDelete,
  handleSave,
} from "../../components/dashboard/dashboardUtils";

export default function Dashboard() {
  const [modalVisible, setModalVisible] = useState(false);
  const [views, setViews] = useState<ViewFilter[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingView, setEditingView] = useState<ViewFilter | null>(null);

  useEffect(() => {
    fetchTransactions()
      .then(setTransactions)
      .catch(() => setTransactions([]));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.addViewButtonWrapper}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addViewButton}
        >
          <Text style={styles.addViewButtonText}>Add View</Text>
        </TouchableOpacity>
      </View>

      <DashboardModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingView(null);
        }}
        onSave={(filter) =>
          handleSave(
            filter,
            editingView,
            setViews,
            setEditingView,
            setModalVisible
          )
        }
        initialValues={editingView}
      />

      <ScrollView style={styles.contentContainer}>
        {views.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <DashboardViewsList
            views={views}
            menuOpen={menuOpen}
            onMenuOpen={setMenuOpen}
            onEdit={(viewId) =>
              handleEdit(views, viewId, setEditingView, setModalVisible)
            }
            onDelete={(viewId) => handleDelete(setViews, viewId, setMenuOpen)}
            getPieData={(view) => getPieData(view, transactions)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 64,
    paddingBottom: 80,
  },
  contentContainer: { flex: 1, paddingHorizontal: 16 },
  addViewButtonWrapper: {
    width: "100%",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  addViewButton: {
    backgroundColor: "#4F8EF7",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addViewButtonText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  viewsWrapper: { flex: 1, alignItems: "stretch" },
});
