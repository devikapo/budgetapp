import React from "react";
import { View } from "react-native";
import DashboardView from "./DashboardView";
import type { ViewFilter } from "./types";

interface DashboardViewsListProps {
  views: ViewFilter[];
  menuOpen: string | null;
  onMenuOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  getPieData: (view: ViewFilter) => any[];
}

const DashboardViewsList: React.FC<DashboardViewsListProps> = ({
  views,
  menuOpen,
  onMenuOpen,
  onEdit,
  onDelete,
  getPieData,
}) => (
  <View style={{ flex: 1, alignItems: "stretch" }}>
    {views.map((view) => {
      const pieData = getPieData(view);
      return (
        <DashboardView
          key={view.id}
          view={view}
          pieData={pieData}
          menuOpen={menuOpen}
          onMenuOpen={onMenuOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
    })}
  </View>
);

export default DashboardViewsList;
