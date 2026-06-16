import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  deleteInventoryItem,
  getInventoryItem,
} from "../../api/inventory.api";
import { getApiErrorMessage } from "../../api/client";
import type { InventoryStackParamList } from "../../navigation/InventoryStack";
import type { InventoryItem } from "../../types/inventory.types";

type Props = NativeStackScreenProps<InventoryStackParamList, "InventoryDetail">;

function getItemName(item?: InventoryItem): string {
  if (!item) return "Zaloga";

  return (
    item.customName ||
    item.custom_name ||
    item.ingredientName ||
    item.ingredient_name ||
    "Zaloga"
  );
}

function getValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function getNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function isLowStock(item?: InventoryItem): boolean {
  if (!item) return false;

  const quantity = getNumberValue(item.quantity);
  const minQuantity = getNumberValue(item.minQuantity ?? item.min_quantity);

  if (quantity === null || minQuantity === null) {
    return false;
  }

  return quantity <= minQuantity;
}

export function InventoryDetailScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const { id } = route.params;

  const inventoryItemQuery = useQuery({
    queryKey: ["inventoryItem", id],
    queryFn: () => getInventoryItem(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInventoryItem(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      navigation.navigate("InventoryList");
    },
  });

  function confirmDelete() {
    Alert.alert(
      "Izbriši zalogo",
      "Ali res želiš izbrisati to zalogo iz inventarja?",
      [
        { text: "Prekliči", style: "cancel" },
        {
          text: "Izbriši",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync();
            } catch (err) {
              Alert.alert("Napaka", getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  if (inventoryItemQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Nalagam zalogo...</Text>
      </View>
    );
  }

  if (inventoryItemQuery.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Napaka pri nalaganju</Text>
          <Text style={styles.errorText}>
            {getApiErrorMessage(inventoryItemQuery.error)}
          </Text>
        </View>
      </View>
    );
  }

  const item = inventoryItemQuery.data;
  const lowStock = isLowStock(item);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{getItemName(item)}</Text>

        {lowStock ? (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockBadgeText}>Nizka zaloga</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("InventoryForm", { id })}
        >
          <Text style={styles.secondaryButtonText}>Uredi zalogo</Text>
        </Pressable>

        <Pressable style={styles.dangerButton} onPress={confirmDelete}>
          <Text style={styles.dangerButtonText}>
            {deleteMutation.isPending ? "Brišem..." : "Izbriši"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Količina</Text>
        <Text style={styles.value}>
          {getValue(item?.quantity)} {item?.unit || ""}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Lokacija</Text>
        <Text style={styles.value}>{getValue(item?.location)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Minimalna količina</Text>
        <Text style={styles.value}>
          {getValue(item?.minQuantity ?? item?.min_quantity)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Rok uporabe</Text>
        <Text style={styles.value}>
          {getValue(item?.expiresAt ?? item?.expires_at)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>ingredientId</Text>
        <Text style={styles.value}>
          {getValue(item?.ingredientId ?? item?.ingredient_id)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Zadnja sprememba</Text>
        <Text style={styles.value}>
          {getValue(item?.updatedAt ?? item?.updated_at)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#f8f9fa",
  },
  centerText: {
    color: "#6c757d",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#212529",
    flexShrink: 1,
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
  actionRow: {
    flexDirection: "row",
    gap: 10,
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
  },
  secondaryButtonText: {
    color: "#495057",
    fontWeight: "800",
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
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    color: "#343a40",
  },
  value: {
    color: "#495057",
    lineHeight: 22,
  },
  errorBox: {
    margin: 16,
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