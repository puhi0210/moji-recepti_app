import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getApiErrorMessage } from "../../api/client";
import { getInventoryItem } from "../../api/inventory.api";
import type { InventoryStackParamList } from "../../navigation/InventoryStack";
import type { InventoryItem } from "../../types/inventory.types";

type Props = NativeStackScreenProps<InventoryStackParamList, "InventoryDetail">;

function getItemName(item?: InventoryItem): string {
  if (!item) return "Sestavina";

  return (
    item.customName ||
    item.custom_name ||
    item.ingredientName ||
    item.ingredient_name ||
    "Sestavina"
  );
}

function getValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export function InventoryDetailScreen({ route }: Props) {
  const { id } = route.params;

  const inventoryItemQuery = useQuery({
    queryKey: ["inventoryItem", id],
    queryFn: () => getInventoryItem(id),
  });

  if (inventoryItemQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Nalagam sestavino...</Text>
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{getItemName(item)}</Text>

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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#212529",
    marginBottom: 4,
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