import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getApiErrorMessage } from "../../api/client";
import {
  clearCheckedShoppingListItems,
  deleteShoppingList,
  deleteShoppingListItem,
  getShoppingList,
  getShoppingListItems,
  updateShoppingListItem,
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
  return (
    item.isChecked === true ||
    item.is_checked === true ||
    item.isChecked === 1 ||
    item.is_checked === 1
  );
}

function formatStatus(status?: string | null): string {
  if (!status) return "-";

  if (status === "active") return "Aktiven";
  if (status === "done") return "Zaključen";
  if (status === "archived") return "Arhiviran";

  return status;
}

export function ShoppingListDetailScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const { id } = route.params;

  const listQuery = useQuery({
    queryKey: ["shoppingList", id],
    queryFn: () => getShoppingList(id),
  });

  const itemsQuery = useQuery({
    queryKey: ["shoppingListItems", id],
    queryFn: () => getShoppingListItems(id, { page: 1, pageSize: 100 }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (item: ShoppingListItem) => {
      const checked = isItemChecked(item);
      return updateShoppingListItem(id, item.id, {
        isChecked: checked ? 0 : 1,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shoppingListItems", id],
      });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: () => deleteShoppingList(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
      navigation.navigate("ShoppingLists");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => deleteShoppingListItem(id, itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shoppingListItems", id],
      });
    },
  });

  const clearCheckedMutation = useMutation({
    mutationFn: () => clearCheckedShoppingListItems(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shoppingListItems", id],
      });
    },
  });

  const items = itemsQuery.data?.items ?? [];
  const checkedCount = items.filter(isItemChecked).length;

  function refetchAll() {
    listQuery.refetch();
    itemsQuery.refetch();
  }

  function confirmDeleteList() {
    Alert.alert(
      "Izbriši listek",
      "Ali res želiš izbrisati ta nakupovalni listek?",
      [
        { text: "Prekliči", style: "cancel" },
        {
          text: "Izbriši",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteListMutation.mutateAsync();
            } catch (err) {
              Alert.alert("Napaka", getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  function confirmDeleteItem(item: ShoppingListItem) {
    Alert.alert(
      "Izbriši postavko",
      "Ali res želiš izbrisati to postavko?",
      [
        { text: "Prekliči", style: "cancel" },
        {
          text: "Izbriši",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItemMutation.mutateAsync(item.id);
            } catch (err) {
              Alert.alert("Napaka", getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  function confirmClearChecked() {
    if (checkedCount === 0) {
      Alert.alert("Ni kupljenih postavk", "Ni postavk za čiščenje.");
      return;
    }

    Alert.alert(
      "Počisti kupljene",
      `Ali želiš odstraniti ${checkedCount} kupljenih postavk?`,
      [
        { text: "Prekliči", style: "cancel" },
        {
          text: "Počisti",
          style: "destructive",
          onPress: async () => {
            try {
              await clearCheckedMutation.mutateAsync();
            } catch (err) {
              Alert.alert("Napaka", getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  function renderShoppingListItem({ item }: { item: ShoppingListItem }) {
    const name = getItemName(item);
    const quantity = item.quantity != null ? String(item.quantity) : "-";
    const unit = item.unit || "";
    const checked = isItemChecked(item);

    return (
      <View style={[styles.itemCard, checked && styles.itemCardChecked]}>
        <View style={styles.itemHeader}>
          <Pressable
            style={[styles.checkbox, checked && styles.checkboxChecked]}
            onPress={async () => {
              try {
                await toggleMutation.mutateAsync(item);
              } catch (err) {
                Alert.alert("Napaka", getApiErrorMessage(err));
              }
            }}
          >
            {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </Pressable>

          <Text style={[styles.itemTitle, checked && styles.itemTitleChecked]}>
            {name}
          </Text>

          <Text style={styles.quantity}>
            {quantity} {unit}
          </Text>
        </View>

        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}

        <View style={styles.itemActions}>
          <Pressable
            style={styles.inlineButton}
            onPress={() =>
              navigation.navigate("ShoppingListItemForm", {
                listId: id,
                item,
              })
            }
          >
            <Text style={styles.inlineButtonText}>Uredi</Text>
          </Pressable>

          <Pressable
            style={styles.inlineDangerButton}
            onPress={() => confirmDeleteItem(item)}
          >
            <Text style={styles.inlineDangerButtonText}>Briši</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isLoading = listQuery.isLoading || itemsQuery.isLoading;
  const isError = listQuery.isError || itemsQuery.isError;

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
        <Text style={styles.subtitle}>
          Status: {formatStatus(list?.status)} · Kupljeno: {checkedCount}/
          {items.length}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("ShoppingListForm", { id })}
        >
          <Text style={styles.secondaryButtonText}>Uredi listek</Text>
        </Pressable>

        <Pressable style={styles.dangerButton} onPress={confirmDeleteList}>
          <Text style={styles.dangerButtonText}>
            {deleteListMutation.isPending ? "Brišem..." : "Izbriši"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate("ShoppingListItemForm", { listId: id })
          }
        >
          <Text style={styles.primaryButtonText}>+ Dodaj postavko</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={confirmClearChecked}
        >
          <Text style={styles.secondaryButtonText}>
            {clearCheckedMutation.isPending ? "Čistim..." : "Počisti kupljene"}
          </Text>
        </Pressable>
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
            <Text style={styles.centerText}>Trenutno ni dodanih postavk.</Text>
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
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ced4da",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  secondaryButtonText: {
    color: "#495057",
    fontWeight: "800",
    textAlign: "center",
  },
  dangerButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#c92a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    color: "#ffffff",
    fontWeight: "800",
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
    gap: 10,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#ced4da",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#212529",
    borderColor: "#212529",
  },
  checkboxMark: {
    color: "#ffffff",
    fontWeight: "800",
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
    marginLeft: 36,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 36,
  },
  inlineButton: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ced4da",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  inlineButtonText: {
    color: "#495057",
    fontWeight: "800",
    fontSize: 13,
  },
  inlineDangerButton: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffc9c9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  inlineDangerButtonText: {
    color: "#c92a2a",
    fontWeight: "800",
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