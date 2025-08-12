import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { Provider as PaperProvider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { formatCategory } from "./dashboardUtils";

export default function AddViewModal({
  visible,
  onClose,
  onSave,
  initialValues,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    dateRange: { start: Date | undefined; end: Date | undefined };
    categories: string[];
    transactionType: "spending" | "income";
  }) => void;
  initialValues?: {
    name?: string;
    dateRange: { start: Date | undefined; end: Date | undefined };
    categories: string[];
    transactionType?: "spending" | "income";
  } | null;
}) {
  const [range, setRange] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ startDate: undefined, endDate: undefined });
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  // Use a Set for selected categories for easier logic
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [allChecked, setAllChecked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [transactionType, setTransactionType] = useState<"spending" | "income">(
    initialValues?.transactionType || "spending"
  );

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    fetch("http://localhost:8000/api/transactions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch transactions");
        return res.json();
      })
      .then((data) => {
        // Extract unique categories from Plaid data
        const cats = Array.from(
          new Set(
            data.flatMap((t: any) =>
              t.personal_finance_category?.primary
                ? [t.personal_finance_category.primary]
                : t.category && Array.isArray(t.category)
                ? t.category
                : []
            )
          )
        ).filter(Boolean) as string[];
        setCategories(cats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [visible]);

  // When categories change, select all by default or restore from initialValues
  useEffect(() => {
    if (categories.length > 0) {
      if (
        initialValues &&
        initialValues.categories &&
        initialValues.categories.length > 0
      ) {
        setSelectedCategories(new Set(initialValues.categories));
        setAllChecked(initialValues.categories.length === categories.length);
      } else {
        setSelectedCategories(new Set(categories));
        setAllChecked(true);
      }
    }
  }, [categories, initialValues]);

  // Prefill initial values if available
  useEffect(() => {
    if (initialValues && visible) {
      setRange({
        startDate: initialValues.dateRange?.start,
        endDate: initialValues.dateRange?.end,
      });
      setSelectedCategories(new Set(initialValues.categories || []));
      setName(initialValues.name || "");
      setTransactionType(initialValues.transactionType || "spending");
    } else if (visible) {
      setRange({ startDate: undefined, endDate: undefined });
      setSelectedCategories(new Set());
      setName("");
      setTransactionType("spending");
    }
  }, [initialValues, visible]);

  // Check/uncheck all handler
  const handleCheckAll = () => {
    if (allChecked) {
      setSelectedCategories(new Set());
      setAllChecked(false);
    } else {
      setSelectedCategories(new Set(categories));
      setAllChecked(true);
    }
  };

  // Save handler
  const handleSave = () => {
    onSave({
      name,
      dateRange: {
        start: range.startDate,
        end: range.endDate,
      },
      categories: Array.from(selectedCategories),
      transactionType,
    });
    onClose();
  };

  return (
    <PaperProvider>
      <View style={styles.overlayWrapper}>
        {/* Overlay to close modal when tapping outside */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.overlay}
        />
        <View style={styles.modalContainer}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={28} color="#888" />
          </TouchableOpacity>
          <Text style={styles.titleText}>
            {initialValues ? "Edit dashboard view" : "Add a new dashboard view"}
          </Text>
          {/* Name input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>View Name</Text>
            <View style={styles.inputBox}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Food & Dining, July"
                style={styles.textInput}
                autoFocus={false}
                accessibilityLabel="View Name Input"
                returnKeyType="done"
              />
            </View>
          </View>
          {/* Date range selector horizontal layout */}
          <View style={styles.dateRow}>
            <TouchableOpacity
              onPress={() => setOpen(true)}
              style={styles.dateIconButton}
            >
              <Ionicons name="calendar-outline" size={24} color="#4F8EF7" />
            </TouchableOpacity>
            {range.startDate && range.endDate ? (
              <Text style={styles.dateText}>
                {`${range.startDate.toLocaleDateString()} - ${range.endDate.toLocaleDateString()}`}
              </Text>
            ) : (
              <TouchableOpacity onPress={() => setOpen(true)}>
                <Text style={styles.noRangeText}>No range selected</Text>
              </TouchableOpacity>
            )}
          </View>
          <DatePickerModal
            locale="en"
            mode="range"
            visible={open}
            label="Select a date range"
            onDismiss={() => setOpen(false)}
            startDate={range.startDate}
            endDate={range.endDate}
            onConfirm={({ startDate, endDate }) => {
              setOpen(false);
              setRange({ startDate, endDate });
            }}
          />
          {/* Transaction Type Toggle */}
          <View style={styles.typeToggleRow}>
            <TouchableOpacity
              style={[
                styles.typeToggleButton,
                transactionType === "spending" && styles.typeToggleButtonActive,
              ]}
              onPress={() => setTransactionType("spending")}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  transactionType === "spending" && styles.typeToggleTextActive,
                ]}
              >
                Spending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeToggleButton,
                transactionType === "income" && styles.typeToggleButtonActive,
              ]}
              onPress={() => setTransactionType("income")}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  transactionType === "income" && styles.typeToggleTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>
          {/* Category Checklist */}
          <Text style={styles.categoryLabel}>Select categories</Text>
          {/* Check/Uncheck All */}
          <TouchableOpacity
            onPress={handleCheckAll}
            style={styles.checkAllRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: allChecked }}
          >
            <View
              style={[styles.checkbox, allChecked && styles.checkboxChecked]}
            >
              {allChecked && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkAllText}>
              {allChecked ? "Uncheck All" : "Check All"}
            </Text>
          </TouchableOpacity>
          {loading ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.categoryListWrapper}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryRow}
                  onPress={() => {
                    setSelectedCategories((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(cat)) {
                        newSet.delete(cat);
                      } else {
                        newSet.add(cat);
                      }
                      setAllChecked(newSet.size === categories.length);
                      return newSet;
                    });
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selectedCategories.has(cat) }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedCategories.has(cat) && styles.checkboxChecked,
                    ]}
                  >
                    {selectedCategories.has(cat) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.categoryText}>{formatCategory(cat)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Save Button at the bottom */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!name.trim() ||
                selectedCategories.size === 0 ||
                !range.startDate ||
                !range.endDate) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={
              !name.trim() ||
              selectedCategories.size === 0 ||
              !range.startDate ||
              !range.endDate
            }
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  overlayWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "100%",
    minHeight: "66%",
    maxHeight: "80%",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  titleText: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 16,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: 6,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    backgroundColor: "#fafbfc",
  },
  textInput: {
    fontSize: 16,
    color: "#222",
    paddingVertical: 6,
    height: 36,
  },
  dateRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  dateIconButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 7,
    marginTop: 1,
  },
  noRangeText: {
    marginLeft: 7,
    marginTop: 1,
    color: "#4F8EF7",
  },
  categoryLabel: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  checkAllRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#bbb",
    backgroundColor: "#fff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    borderColor: "#4F8EF7",
    backgroundColor: "#4F8EF7",
  },
  checkAllText: {
    fontSize: 16,
    color: "#222",
  },
  loadingIndicator: {
    marginVertical: 12,
  },
  errorText: {
    color: "#C62828",
    marginVertical: 12,
  },
  categoryListWrapper: {
    width: "100%",
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 16,
    color: "#222",
  },
  typeToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 4,
    width: "100%",
  },
  typeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  typeToggleButtonActive: {
    backgroundColor: "#4F8EF7",
  },
  typeToggleText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },
  typeToggleTextActive: {
    color: "#fff",
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#4F8EF7",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: "#b0c7ec",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
