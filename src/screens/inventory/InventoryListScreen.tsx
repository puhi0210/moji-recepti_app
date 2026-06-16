import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getApiErrorMessage } from "../../api/client";
import { getInventoryItems } from "../../api/inventory.api";
import { useDebounce } from "../../hooks/useDebounce";
import type { InventoryItem } from "../../types/inventory.types";
import type { InventoryStackParamList } from "../../navigation/InventoryStack";

type Props = NativeStackScreenProps<InventoryStackParamList, "InventoryList">;

const PAGE_SIZE = 20;

function getItemName(item: InventoryItem): string {
  return (
    item.customName ||
    item.custom_name ||
    item.ingredientName ||
    item.ingredient_name ||
    "Zaloga"
  );
}

function getNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function isLowStock(item: InventoryItem): boolean {
  const quantity = getNumberValue(item.quantity);
  const minQuantity = getNumberValue(item.minQuantity ?? item.min_quantity);

  if (quantity === null || minQuantity === null) {
    return false;
  }

  return quantity <= minQuantity;
}

function getMinQuantity(item: InventoryItem): string {
  const minQuantity = item.minQuantity ?? item.min_quantity;
  return minQuantity != null ? String(minQuantity) : "-";
}

function getExpiresAt(item: InventoryItem): string {
  return item.expiresAt || item.expires_at || "-";
}

export function InventoryListScreen({ navigation }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const inventoryQuery = useQuery({
    queryKey: [
      "inventory",
      {
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
        lowStockOnly,
      },
    ],
    queryFn: () =>
      getInventoryItems({
        search: debouncedSearch.trim(),
        page,
        pageSize: PAGE_SIZE,
        lowStockOnly,
      }),
  });

  const items = inventoryQuery.data?.items ?? [];
  const total = inventoryQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleToggleLowStockOnly() {
    setLowStockOnly((current) => !current);
    setPage(1);
  }

  function renderItem({ item }: { item: InventoryItem }) {
    const name = getItemName(item);
    const quantity = item.quantity != null ? String(item.quantity) : "-";
    const unit = item.unit || "";
    const location = item.location || "-";
    const lowStock = isLowStock(item);

    return (
      <Pressable
        style={[styles.card, lowStock && styles.lowStockCard]}
        onPress={() => navigation.navigate("InventoryDetail", { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.itemTitle}>{name}</Text>

          {lowStock ? (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>Nizka zaloga</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.row}>
          <Text style={styles.metaText}>
            Količina: {quantity} {unit}
          </Text>
          <Text style={styles.metaText}>Lokacija: {location}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.metaText}>Minimum: {getMinQuantity(item)}</Text>
          <Text style={styles.metaText}>Rok: {getExpiresAt(item)}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Inventar</Text>
          <Text style={styles.subtitle}>Skupaj: {total}</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("InventoryForm")}
        >
          <Text style={styles.addButtonText}>+ Dodaj</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Išči sestavine ali zaloge..."
        placeholderTextColor="#868e96"
        value={search}
        onChangeText={handleSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Pressable
        style={[
          styles.filterButton,
          lowStockOnly && styles.filterButtonActive,
        ]}
        onPress={handleToggleLowStockOnly}
      >
        <Text
          style={[
            styles.filterButtonText,
            lowStockOnly && styles.filterButtonTextActive,
          ]}
        >
          {lowStockOnly ? "✓ Samo nizka zaloga" : "Samo nizka zaloga"}
        </Text>
      </Pressable>

      {inventoryQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.centerText}>Nalagam inventar...</Text>
        </View>
      ) : inventoryQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Napaka pri nalaganju</Text>
          <Text style={styles.errorText}>
            {getApiErrorMessage(inventoryQuery.error)}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => inventoryQuery.refetch()}
          >
            <Text style={styles.retryButtonText}>Poskusi znova</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={
              items.length === 0 ? styles.emptyList : styles.list
            }
            refreshControl={
              <RefreshControl
                refreshing={inventoryQuery.isRefetching}
                onRefresh={inventoryQuery.refetch}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>Inventar je prazen</Text>
                <Text style={styles.centerText}>
                  {debouncedSearch
                    ? "Za ta iskalni niz ni rezultatov."
                    : lowStockOnly
                      ? "Trenutno ni zalog z nizkim stanjem."
                      : "Trenutno ni dodanih zalog."}
                </Text>
              </View>
            }
          />

          <View style={styles.pagination}>
            <Pressable
              style={[styles.pageButton, page <= 1 && styles.disabledButton]}
              disabled={page <= 1}
              onPress={() => setPage((currentPage) => currentPage - 1)}
            >
              <Text style={styles.pageButtonText}>Prejšnja</Text>
            </Pressable>

            <Text style={styles.pageText}>
              {page} / {totalPages}
            </Text>

            <Pressable
              style={[
                styles.pageButton,
                page >= totalPages && styles.disabledButton,
              ]}
              disabled={page >= totalPages}
              onPress={() => setPage((currentPage) => currentPage + 1)}
            >
              <Text style={styles.pageButtonText}>Naslednja</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  headerRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#212529",
  },
  subtitle: {
    color: "#6c757d",
    marginTop: 2,
  },
  addButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#212529",
    marginBottom: 10,
  },
  filterButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ced4da",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  filterButtonActive: {
    backgroundColor: "#fff5f5",
    borderColor: "#ffc9c9",
  },
  filterButtonText: {
    color: "#495057",
    fontWeight: "800",
  },
  filterButtonTextActive: {
    color: "#c92a2a",
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 8,
  },
  lowStockCard: {
    borderColor: "#ffc9c9",
    backgroundColor: "#fffafa",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  lowStockBadge: {
    borderRadius: 999,
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffc9c9",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lowStockBadgeText: {
    color: "#c92a2a",
    fontSize: 12,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaText: {
    color: "#6c757d",
    fontSize: 13,
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  centerText: {
    color: "#6c757d",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#343a40",
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff5f5",
    gap: 10,
  },
  errorTitle: {
    color: "#c92a2a",
    fontSize: 16,
    fontWeight: "800",
  },
  errorText: {
    color: "#842029",
  },
  retryButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    gap: 12,
  },
  pageButton: {
    minHeight: 42,
    minWidth: 110,
    borderRadius: 10,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  pageText: {
    color: "#495057",
    fontWeight: "700",
  },
});