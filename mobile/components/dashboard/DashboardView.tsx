import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { MaterialIcons } from "@expo/vector-icons";

interface DashboardViewProps {
  view: any;
  pieData: any[];
  menuOpen: string | null;
  onMenuOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  view,
  pieData,
  menuOpen,
  onMenuOpen,
  onEdit,
  onDelete,
}) => {
  return (
    <View key={view.id} style={styles.card}>
      <View style={styles.menuWrapper}>
        {menuOpen === view.id && (
          <View style={styles.menuOverlay} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => onMenuOpen("")}
              style={styles.menuTouchableOverlay}
            />
            <View style={styles.menuDropdown}>
              <TouchableOpacity
                onPress={() => {
                  onEdit(view.id);
                  onMenuOpen("");
                }}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(view.id)}
                style={styles.menuItem}
              >
                <Text style={[styles.menuItemText, styles.menuDeleteText]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <TouchableOpacity
          onPress={() => onMenuOpen(view.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="more-horiz" size={28} color="#888" />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardTitle}>{view.name || "Pie Chart"}</Text>
      <View style={styles.pieChartWrapper}>
        <View
          style={{
            position: "relative",
            width: 180,
            height: 180,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PieChart
            data={pieData}
            showText={false}
            radius={90}
            donut
            innerRadius={60}
          />
          <View style={styles.donutCenterWrapper} pointerEvents="none">
            <Text style={styles.donutCenterText}>
              ${pieData.reduce((sum, d) => sum + d.value, 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.legendWrapper}>
        {pieData.map((d) => (
          <View key={d.text} style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>{d.text}</Text>
            <Text style={styles.legendValue}>${d.value.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    borderWidth: 1,
    borderColor: "black",
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
    marginBottom: 16,
  },
  menuWrapper: { position: "absolute", top: 16, right: 16, zIndex: 2 },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  menuTouchableOverlay: {
    position: "absolute",
    top: -1000,
    left: -1000,
    width: 3000,
    height: 3000,
    zIndex: 10,
  },
  menuDropdown: {
    position: "absolute",
    top: 30,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 120,
    paddingVertical: 4,
    zIndex: 20,
  },
  menuItem: { padding: 12 },
  menuItemText: { fontSize: 16 },
  menuDeleteText: { color: "#e53935" },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  pieChartWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterText: { fontSize: 22, fontWeight: "700", color: "#222" },
  legendWrapper: { marginTop: 18 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    width: "100%",
  },
  legendColor: { width: 16, height: 16, borderRadius: 8, marginRight: 10 },
  legendText: { color: "#222", fontWeight: "600", fontSize: 15, flex: 1 },
  legendValue: { color: "#7b8794", fontWeight: "500", fontSize: 15 },
});

export default DashboardView;
