import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createRecipeIngredient,
  updateRecipeIngredient,
  type SaveRecipeIngredientPayload,
} from "../../api/recipes.api";
import { getApiErrorMessage } from "../../api/client";
import { FormActions } from "../../components/FormActions";
import { FormTextInput } from "../../components/FormTextInput";
import type { RecipesStackParamList } from "../../navigation/RecipesStack";

type Props = NativeStackScreenProps<
  RecipesStackParamList,
  "RecipeIngredientForm"
>;

function numberRequired(value: string): number {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Količina je obvezna.");
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

export function RecipeIngredientFormScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();

  const { recipeId, recipeIngredient } = route.params;
  const isEdit = Boolean(recipeIngredient);

  const [ingredientId, setIngredientId] = useState(
    recipeIngredient?.ingredient_id != null
      ? String(recipeIngredient.ingredient_id)
      : recipeIngredient?.ingredientId != null
        ? String(recipeIngredient.ingredientId)
        : ""
  );

  const [ingredientName, setIngredientName] = useState(
    recipeIngredient?.ingredient_name ||
      recipeIngredient?.ingredientName ||
      recipeIngredient?.name ||
      ""
  );

  const [quantity, setQuantity] = useState(
    recipeIngredient?.quantity != null ? String(recipeIngredient.quantity) : ""
  );

  const [unit, setUnit] = useState(recipeIngredient?.unit ?? "");
  const [note, setNote] = useState(recipeIngredient?.note ?? "");

  const [error, setError] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const q = numberRequired(quantity);

      if (isEdit) {
        const rowId = recipeIngredient?.id;

        if (!rowId) {
          throw new Error(
            "Manjka ID vrstice sestavine. Pošlji mi JSON response recepta."
          );
        }

        return updateRecipeIngredient(recipeId, rowId, {
          quantity: q,
          unit: stringOrNull(unit),
          note: stringOrNull(note),
        });
      }

      const parsedIngredientId = ingredientId.trim()
        ? Number(ingredientId.trim())
        : null;

      if (
        ingredientId.trim() &&
        (Number.isNaN(parsedIngredientId) || !parsedIngredientId)
      ) {
        throw new Error("ingredientId mora biti številka.");
      }

      const name = stringOrNull(ingredientName);

      if (!parsedIngredientId && !name) {
        throw new Error("Vnesi ingredientId ali ime sestavine.");
      }

      const payload: SaveRecipeIngredientPayload = {
        ingredientId: parsedIngredientId,
        ingredientName: parsedIngredientId ? null : name,
        quantity: q,
        unit: stringOrNull(unit),
        note: stringOrNull(note),
      };

      return createRecipeIngredient(recipeId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
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
        {isEdit ? "Uredi sestavino" : "Dodaj sestavino"}
      </Text>

      {!isEdit ? (
        <>
          <FormTextInput
            label="ingredientId"
            helper="Opcijsko. Če ga vneseš, se ime sestavine ignorira."
            value={ingredientId}
            onChangeText={setIngredientId}
            placeholder="npr. 5"
            keyboardType="numeric"
          />

          <FormTextInput
            label="Ime sestavine"
            helper="Uporabi, če ne poznaš ingredientId."
            value={ingredientName}
            onChangeText={setIngredientName}
            placeholder="npr. Moka"
          />
        </>
      ) : (
        <Text style={styles.editInfo}>
          Sestavina: {ingredientName || "Sestavina"}
        </Text>
      )}

      <FormTextInput
        label="Količina *"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="npr. 300"
        keyboardType="numeric"
      />

      <FormTextInput
        label="Enota"
        value={unit}
        onChangeText={setUnit}
        placeholder="g / kg / ml / kos"
      />

      <FormTextInput
        label="Opomba"
        value={note}
        onChangeText={setNote}
        placeholder="npr. tip 500"
        multiline
        style={styles.multiline}
      />

      {error ? <Text style={styles.errorTextBox}>{error}</Text> : null}

      <FormActions
        saving={saveMutation.isPending}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveTitle={isEdit ? "Shrani spremembe" : "Dodaj sestavino"}
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
  editInfo: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    color: "#495057",
    marginBottom: 12,
    fontWeight: "700",
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