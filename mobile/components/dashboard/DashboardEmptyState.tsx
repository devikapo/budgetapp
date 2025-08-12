import React from "react";
import { View, Text } from "react-native";

const DashboardEmptyState = () => (
  <View style={{ padding: 32, alignItems: "center" }}>
    <Text style={{ color: "#888", fontSize: 18 }}>
      No views yet. Tap "Add View" to get started!
    </Text>
  </View>
);

export default DashboardEmptyState;
