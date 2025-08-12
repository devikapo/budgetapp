import React, { useState } from "react";
import { Modal } from "react-native";
import AddViewModal from "./AddViewModal";

interface DashboardModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (filter: {
    name: string;
    dateRange: { start?: Date; end?: Date };
    categories: string[];
    transactionType: "spending" | "income";
  }) => void;
  initialValues?: any;
}

const DashboardModal: React.FC<DashboardModalProps> = ({
  visible,
  onClose,
  onSave,
  initialValues,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <AddViewModal
        visible={visible}
        onClose={onClose}
        onSave={onSave}
        initialValues={initialValues as any}
      />
    </Modal>
  );
};

export default DashboardModal;
