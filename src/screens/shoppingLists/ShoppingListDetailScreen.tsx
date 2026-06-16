import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getApiErrorMessage } from "../../api/client";
import {
  getShoppingList,
  getShoppingListItems,
} from "../../api/shoppingLists.api";
import type { ShoppingListsStackParamList } from "../../navigation/ShoppingListsStack";
import type { ShoppingListItem } from "../../types/shoppingList.types";

type Props = NativeStackScreenProps<
  ShoppingListsStackParamList,
  "ShoppingListDetail"
>;

function getItemName(item: ShoppingListItem): string {
  return (
    item.customName ||
    item.custom_name ||
    item.ingredientName ||
    item.ingredient_name ||
    "Postavka"
  );
}

function isItemChecked(item: ShoppingListItem): boolean {
  return item.isChecked === true || item.is_checked === true || item.is_checked === 1;
}

function renderShoppingListItem({ item }: { item: ShoppingListItem }) {
  const name = getItemName(item);
  const quantity = item.quantity != null ? String(item.quantity) : "-";
  const unit = item.unit || "";
  const checked = isItemChecked(item);

  return (
    <View style={[styles.itemCard, checked && styles.itemCardChecked]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, checked && styles.itemTitleChecked]}>
          {checked ? "✓ " : ""}
          {name}
        </Text>

        <Text style={styles.quantity}>
          {quantity} {unit}
        </Text>
      </View>

      {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
    </View>
  );
}

export function ShoppingListDetailScreen({ route }: Props) {
  const { id } = route.params;

  const listQuery = useQuery({
    queryKey: ["shoppingList", id],
    queryFn: () => getShoppingList(id),
  });

  const itemsQuery = useQuery({
    queryKey: ["shoppingListItems", id],
    queryFn: () => getShoppingListItems(id, { page: 1, pageSize: 100 }),
  });

  const isLoading = listQuery.isLoading || itemsQuery.isLoading;
  const isError = listQuery.isError || itemsQuery.isError;

  const items = itemsQuery.data?.items ?? [];

  function refetchAll() {
    listQuery.refetch();
    itemsQuery.refetch();
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Nalagam listek...</Text>
      </View>
    );
  }

  if (isError) {
    const error = listQuery.error || itemsQuery.error;

    return (
      <View style={styles.screen}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Napaka pri nalaganju</Text>
          <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
        </View>
      </View>
    );
  }

  const list = listQuery.data;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{list?.name ?? "Nakupovalni listek"}</Text>
        <Text style={styles.subtitle}>Postavke: {items.length}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderShoppingListItem}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching || itemsQuery.isRefetching}
            onRefresh={refetchAll}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Listek je prazen</Text>
            <Text style={styles.centerText}>
              Trenutno ni dodanih postavk.
            </Text>
          </View>
        }
      />
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
    fontSize: 28,
    fontWeight: "800",
    color: "#212529",
  },
  subtitle: {
    color: "#6c757d",
    marginTop: 2,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  itemCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 8,
  },
  itemCardChecked: {
    opacity: 0.65,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  itemTitleChecked: {
    textDecorationLine: "line-through",
    color: "#6c757d",
  },
  quantity: {
    color: "#495057",
    fontWeight: "700",
  },
  note: {
    color: "#6c757d",
    fontSize: 13,
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
});