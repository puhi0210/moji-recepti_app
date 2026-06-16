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
import { getShoppingLists } from "../../api/shoppingLists.api";
import { useDebounce } from "../../hooks/useDebounce";
import type { ShoppingList } from "../../types/shoppingList.types";
import type { ShoppingListsStackParamList } from "../../navigation/ShoppingListsStack";

type Props = NativeStackScreenProps<
  ShoppingListsStackParamList,
  "ShoppingLists"
>;

const PAGE_SIZE = 20;

function formatStatus(status?: string | null): string {
  if (!status) return "-";

  if (status === "active") return "Aktiven";
  if (status === "done") return "Zaključen";
  if (status === "archived") return "Arhiviran";

  return status;
}

function getUpdatedAt(list: ShoppingList): string {
  return list.updatedAt || list.updated_at || "-";
}

export function ShoppingListsScreen({ navigation }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const shoppingListsQuery = useQuery({
    queryKey: [
      "shoppingLists",
      { search: debouncedSearch, page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      getShoppingLists({
        search: debouncedSearch.trim(),
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const lists = shoppingListsQuery.data?.items ?? [];
  const total = shoppingListsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function renderList({ item }: { item: ShoppingList }) {
    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          navigation.navigate("ShoppingListDetail", { id: item.id })
        }
      >
        <Text style={styles.itemTitle}>{item.name}</Text>

        <View style={styles.row}>
          <Text style={styles.metaText}>
            Status: {formatStatus(item.status)}
          </Text>
          <Text style={styles.metaText}>Spremenjeno: {getUpdatedAt(item)}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Listki</Text>
        <Text style={styles.subtitle}>Skupaj: {total}</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Išči nakupovalne listke..."
        placeholderTextColor="#868e96"
        value={search}
        onChangeText={handleSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {shoppingListsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.centerText}>Nalagam listke...</Text>
        </View>
      ) : shoppingListsQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Napaka pri nalaganju</Text>
          <Text style={styles.errorText}>
            {getApiErrorMessage(shoppingListsQuery.error)}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => shoppingListsQuery.refetch()}
          >
            <Text style={styles.retryButtonText}>Poskusi znova</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={lists}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderList}
            contentContainerStyle={
              lists.length === 0 ? styles.emptyList : styles.list
            }
            refreshControl={
              <RefreshControl
                refreshing={shoppingListsQuery.isRefetching}
                onRefresh={shoppingListsQuery.refetch}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>Ni listkov</Text>
                <Text style={styles.centerText}>
                  {debouncedSearch
                    ? "Za ta iskalni niz ni rezultatov."
                    : "Trenutno ni dodanih nakupovalnih listkov."}
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
  header: {
    marginBottom: 12,
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
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#212529",
    marginBottom: 12,
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
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
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