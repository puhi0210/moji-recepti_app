import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createRecipe,
  getRecipe,
  updateRecipe,
  type SaveRecipePayload,
} from "../../api/recipes.api";
import { getApiErrorMessage } from "../../api/client";
import { FormTextInput } from "../../components/FormTextInput";
import { FormActions } from "../../components/FormActions";
import type { RecipesStackParamList } from "../../navigation/RecipesStack";

type Props = NativeStackScreenProps<RecipesStackParamList, "RecipeForm">;

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

export function RecipeFormScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();

  const recipeId = route.params?.id;
  const isEdit = typeof recipeId === "number";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState("");
  const [servings, setServings] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  const recipeQuery = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipe(recipeId as number),
    enabled: isEdit,
  });

  useEffect(() => {
    const recipe = recipeQuery.data;

    if (!recipe) {
      return;
    }

    setTitle(recipe.title ?? "");
    setDescription(recipe.description ?? "");
    setInstructions(recipe.instructions ?? "");

    setPrepTimeMinutes(
      recipe.prepTimeMinutes != null
        ? String(recipe.prepTimeMinutes)
        : recipe.prep_time_minutes != null
          ? String(recipe.prep_time_minutes)
          : ""
    );

    setCookTimeMinutes(
      recipe.cookTimeMinutes != null
        ? String(recipe.cookTimeMinutes)
        : recipe.cook_time_minutes != null
          ? String(recipe.cook_time_minutes)
          : ""
    );

    setServings(recipe.servings != null ? String(recipe.servings) : "");

    setIsPublic(Number(recipe.isPublic ?? recipe.is_public ?? 0) === 1);
  }, [recipeQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SaveRecipePayload) => {
      if (isEdit && recipeId) {
        return updateRecipe(recipeId, payload);
      }

      return createRecipe(payload);
    },
    onSuccess: async (savedRecipe) => {
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });

      if (isEdit && recipeId) {
        await queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
        navigation.goBack();
        return;
      }

      const newId = savedRecipe?.id;

      if (newId) {
        navigation.replace("RecipeDetail", { id: newId });
      } else {
        navigation.goBack();
      }
    },
  });

  function buildPayload(): SaveRecipePayload {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      throw new Error("Naslov recepta je obvezen.");
    }

    return {
      title: trimmedTitle,
      description: stringOrNull(description),
      instructions: stringOrNull(instructions),
      prepTimeMinutes: numberOrNull(prepTimeMinutes),
      cookTimeMinutes: numberOrNull(cookTimeMinutes),
      servings: numberOrNull(servings),
      isPublic: isPublic ? 1 : 0,
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

  if (isEdit && recipeQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Nalagam recept...</Text>
      </View>
    );
  }

  if (isEdit && recipeQuery.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Napaka pri nalaganju</Text>
          <Text style={styles.errorText}>
            {getApiErrorMessage(recipeQuery.error)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {isEdit ? "Uredi recept" : "Nov recept"}
      </Text>

      <FormTextInput
        label="Naslov *"
        value={title}
        onChangeText={setTitle}
        placeholder="npr. Testenine s piščancem"
      />

      <FormTextInput
        label="Opis"
        value={description}
        onChangeText={setDescription}
        placeholder="Kratek opis recepta"
        multiline
        style={styles.multiline}
      />

      <FormTextInput
        label="Navodila"
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Postopek priprave..."
        multiline
        style={styles.instructions}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormTextInput
            label="Priprava min"
            value={prepTimeMinutes}
            onChangeText={setPrepTimeMinutes}
            placeholder="10"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.rowItem}>
          <FormTextInput
            label="Kuhanje min"
            value={cookTimeMinutes}
            onChangeText={setCookTimeMinutes}
            placeholder="20"
            keyboardType="numeric"
          />
        </View>
      </View>

      <FormTextInput
        label="Porcije"
        value={servings}
        onChangeText={setServings}
        placeholder="4"
        keyboardType="numeric"
      />

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setIsPublic((current) => !current)}
      >
        <View style={[styles.checkbox, isPublic && styles.checkboxChecked]}>
          {isPublic ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>

        <Text style={styles.checkboxText}>Javen recept</Text>
      </Pressable>

      {error ? <Text style={styles.errorTextBox}>{error}</Text> : null}

      <FormActions
        saving={saveMutation.isPending}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveTitle={isEdit ? "Shrani spremembe" : "Dodaj recept"}
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
  multiline: {
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  instructions: {
    minHeight: 140,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
  checkboxText: {
    color: "#212529",
    fontWeight: "700",
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