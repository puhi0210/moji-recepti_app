import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createInventoryItem,
  getInventoryItem,
  updateInventoryItem,
  type SaveInventoryItemPayload,
} from "../../api/inventory.api";
import { getApiErrorMessage } from "../../api/client";
import { FormActions } from "../../components/FormActions";
import { FormTextInput } from "../../components/FormTextInput";
import type { InventoryStackParamList } from "../../navigation/InventoryStack";

type Props = NativeStackScreenProps<InventoryStackParamList, "InventoryForm">;

function numberRequired(value: string, label: string): number {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} je obvezno polje.`);
  }

  const parsed = Number(trimmed.replace(",", "."));

  if (Number.isNaN(parsed)) {
    throw new Error(`${label} mora biti veljavno število.`);
  }

  return parsed;
}

function numberOrNull(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed.replace(",", "."));

  if (Number.isNaN(parsed)) {
    throw new Error("Številska polja morajo biti veljavna števila.");
  }

  return parsed;
}

function stringOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function InventoryFormScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();

  const itemId = route.params?.id;
  const isEdit = typeof itemId === "number";

  const [ingredientId, setIngredientId] = useState("");
  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [error, setError] = useState("");

  const itemQuery = useQuery({
    queryKey: ["inventoryItem", itemId],
    queryFn: () => getInventoryItem(itemId as number),
    enabled: isEdit,
  });

  useEffect(() => {
    const item = itemQuery.data;

    if (!item) {
      return;
    }

    const loadedIngredientId = item.ingredientId ?? item.ingredient_id;

    setIngredientId(
      loadedIngredientId != null ? String(loadedIngredientId) : ""
    );

    setCustomName(
      item.customName ||
        item.custom_name ||
        item.ingredientName ||
        item.ingredient_name ||
        ""
    );

    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setUnit(item.unit ?? "");
    setLocation(item.location ?? "");
    setExpiresAt(item.expiresAt ?? item.expires_at ?? "");

    const loadedMinQuantity = item.minQuantity ?? item.min_quantity;
    setMinQuantity(
      loadedMinQuantity != null ? String(loadedMinQuantity) : ""
    );
  }, [itemQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SaveInventoryItemPayload) => {
      if (isEdit && itemId) {
        return updateInventoryItem(itemId, payload);
      }

      return createInventoryItem(payload);
    },
    onSuccess: async (savedItem) => {
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });

      if (isEdit && itemId) {
        await queryClient.invalidateQueries({
          queryKey: ["inventoryItem", itemId],
        });
        navigation.goBack();
        return;
      }

      const newId = savedItem?.id;

      if (newId) {
        navigation.replace("InventoryDetail", { id: newId });
      } else {
        navigation.goBack();
      }
    },
  });

  function buildPayload(): SaveInventoryItemPayload {
    const parsedIngredientId = ingredientId.trim()
      ? Number(ingredientId.trim())
      : null;

    if (
      ingredientId.trim() &&
      (Number.isNaN(parsedIngredientId) || !parsedIngredientId)
    ) {
      throw new Error("ingredientId mora biti veljavna številka.");
    }

    const parsedCustomName = stringOrNull(customName);

    if (!parsedIngredientId && !parsedCustomName) {
      throw new Error("Vnesi ingredientId ali ime zaloge/sestavine.");
    }

    const parsedUnit = unit.trim();

    if (!parsedUnit) {
      throw new Error("Enota je obvezna.");
    }

    const parsedLocation = location.trim();

    if (!parsedLocation) {
      throw new Error("Lokacija je obvezna.");
    }

    return {
      ingredientId: parsedIngredientId,
      customName: parsedIngredientId ? null : parsedCustomName,
      quantity: numberRequired(quantity, "Količina"),
      unit: parsedUnit,
      location: parsedLocation,
      expiresAt: stringOrNull(expiresAt),
      minQuantity: numberOrNull(minQuantity),
    };
  }

  async function handleSave() {
    setError("");

    try {
      const payload = buildPayload();
      await saveMutation.mutateAsync(payload);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  if (isEdit && itemQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Nalagam zalogo...</Text>
      </View>
    );
  }

  if (isEdit && itemQuery.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Napaka pri nalaganju</Text>
          <Text style={styles.errorText}>
            {getApiErrorMessage(itemQuery.error)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {isEdit ? "Uredi zalogo" : "Nova zaloga"}
      </Text>

      <FormTextInput
        label="ingredientId"
        helper="Opcijsko. Če ga vneseš, se ime zaloge ignorira."
        value={ingredientId}
        onChangeText={setIngredientId}
        placeholder="npr. 5"
        keyboardType="numeric"
      />

      <FormTextInput
        label="Ime zaloge / sestavine"
        helper="Uporabi, če ne poznaš ingredientId."
        value={customName}
        onChangeText={setCustomName}
        placeholder="npr. Moka"
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormTextInput
            label="Količina *"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.rowItem}>
          <FormTextInput
            label="Enota *"
            value={unit}
            onChangeText={setUnit}
            placeholder="kg / g / kos"
          />
        </View>
      </View>

      <FormTextInput
        label="Lokacija *"
        value={location}
        onChangeText={setLocation}
        placeholder="shramba / hladilnik / zamrzovalnik"
      />

      <FormTextInput
        label="Rok uporabe"
        helper="Format naj bo enak kot v web aplikaciji, npr. 2026-06-16."
        value={expiresAt}
        onChangeText={setExpiresAt}
        placeholder="2026-06-16"
      />

      <FormTextInput
        label="Minimalna količina"
        helper="Za low-stock opozorilo. Nizka zaloga je quantity <= minQuantity."
        value={minQuantity}
        onChangeText={setMinQuantity}
        placeholder="npr. 1"
        keyboardType="numeric"
      />

      {error ? <Text style={styles.errorTextBox}>{error}</Text> : null}

      <FormActions
        saving={saveMutation.isPending}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveTitle={isEdit ? "Shrani spremembe" : "Dodaj zalogo"}
      />
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#212529",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowItem: {
    flex: 1,
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
  errorTextBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff5f5",
    color: "#c92a2a",
    marginBottom: 12,
  },
});