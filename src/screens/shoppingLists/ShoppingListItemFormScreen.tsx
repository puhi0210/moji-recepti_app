import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createShoppingListItem,
  updateShoppingListItem,
  type SaveShoppingListItemPayload,
} from "../../api/shoppingLists.api";
import { getApiErrorMessage } from "../../api/client";
import { FormActions } from "../../components/FormActions";
import { FormTextInput } from "../../components/FormTextInput";
import type { ShoppingListsStackParamList } from "../../navigation/ShoppingListsStack";

type Props = NativeStackScreenProps<
  ShoppingListsStackParamList,
  "ShoppingListItemForm"
>;

function numberOrNull(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed.replace(",", "."));

  if (Number.isNaN(parsed)) {
    throw new Error("Količina mora biti veljavno število.");
  }

  return parsed;
}

function stringOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function ShoppingListItemFormScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();

  const { listId, item } = route.params;
  const isEdit = Boolean(item);

  const [ingredientId, setIngredientId] = useState(
    item?.ingredientId != null
      ? String(item.ingredientId)
      : item?.ingredient_id != null
        ? String(item.ingredient_id)
        : ""
  );

  const [customName, setCustomName] = useState(
    item?.customName ||
      item?.custom_name ||
      item?.ingredientName ||
      item?.ingredient_name ||
      ""
  );

  const [quantity, setQuantity] = useState(
    item?.quantity != null ? String(item.quantity) : ""
  );

  const [unit, setUnit] = useState(item?.unit ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const [error, setError] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
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
        throw new Error("Vnesi ingredientId ali ime postavke.");
      }

      const payload: SaveShoppingListItemPayload = {
        ingredientId: parsedIngredientId,
        customName: parsedIngredientId ? null : parsedCustomName,
        quantity: numberOrNull(quantity),
        unit: stringOrNull(unit),
        note: stringOrNull(note),
      };

      if (isEdit && item?.id) {
        return updateShoppingListItem(listId, item.id, payload);
      }

      return createShoppingListItem(listId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["shoppingListItems", listId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["shoppingList", listId],
      });
      navigation.goBack();
    },
  });

  async function handleSave() {
    setError("");

    try {
      await saveMutation.mutateAsync();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {isEdit ? "Uredi postavko" : "Dodaj postavko"}
      </Text>

      <FormTextInput
        label="ingredientId"
        helper="Opcijsko. Če ga vneseš, se ime postavke ignorira."
        value={ingredientId}
        onChangeText={setIngredientId}
        placeholder="npr. 5"
        keyboardType="numeric"
      />

      <FormTextInput
        label="Ime postavke"
        helper="Uporabi, če ne poznaš ingredientId."
        value={customName}
        onChangeText={setCustomName}
        placeholder="npr. Mleko"
      />

      <FormTextInput
        label="Količina"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="npr. 2"
        keyboardType="numeric"
      />

      <FormTextInput
        label="Enota"
        value={unit}
        onChangeText={setUnit}
        placeholder="l / kg / g / kos"
      />

      <FormTextInput
        label="Opomba"
        value={note}
        onChangeText={setNote}
        placeholder="npr. brez laktoze"
        multiline
        style={styles.multiline}
      />

      {error ? <Text style={styles.errorTextBox}>{error}</Text> : null}

      <FormActions
        saving={saveMutation.isPending}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveTitle={isEdit ? "Shrani spremembe" : "Dodaj postavko"}
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#212529",
    marginBottom: 16,
  },
  multiline: {
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  errorTextBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff5f5",
    color: "#c92a2a",
    marginBottom: 12,
  },
});