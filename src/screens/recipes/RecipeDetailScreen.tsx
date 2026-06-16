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
  deleteRecipe,
  deleteRecipeIngredient,
  getRecipe,
} from "../../api/recipes.api";
import { getApiErrorMessage } from "../../api/client";
import type { RecipesStackParamList } from "../../navigation/RecipesStack";
import type { RecipeIngredient } from "../../types/recipe.types";

type Props = NativeStackScreenProps<RecipesStackParamList, "RecipeDetail">;

function formatIngredientLine(item: RecipeIngredient): string {
  const name =
    item.ingredientName ||
    item.ingredient_name ||
    item.name ||
    "Sestavina";

  const quantity =
    item.quantity !== null && item.quantity !== undefined
      ? String(item.quantity)
      : "";

  const unit = item.unit || "";
  const amount = `${quantity} ${unit}`.trim();

  return amount ? `${name} — ${amount}` : name;
}

function getRecipeIngredientId(item: RecipeIngredient): number | null {
  return item.id ?? null;
}

export function RecipeDetailScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const { id } = route.params;

  const recipeQuery = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => getRecipe(id),
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: () => deleteRecipe(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      navigation.navigate("RecipesList");
    },
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: (recipeIngredientId: number) =>
      deleteRecipeIngredient(id, recipeIngredientId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipe", id] });
    },
  });

  function confirmDeleteRecipe() {
    Alert.alert(
      "Izbriši recept",
      "Ali res želiš izbrisati ta recept?",
      [
        { text: "Prekliči", style: "cancel" },
        {
          text: "Izbriši",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecipeMutation.mutateAsync();
            } catch (err) {
              Alert.alert("Napaka", getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  function confirmDeleteIngredient(item: RecipeIngredient) {
    const rowId = getRecipeIngredientId(item);

    if (!rowId) {
      Alert.alert(
        "Napaka",
        "Manjka ID vrstice sestavine. Pošlji mi JSON response recepta."
      );
      return;
    }

    Alert.alert(
      "Izbriši sestavino",
      "Ali res želiš izbrisati to sestavino iz recepta?",
      [
        { text: "Prekliči", style: "cancel" },
        {
          text: "Izbriši",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteIngredientMutation.mutateAsync(rowId);
            } catch (err) {
              Alert.alert("Napaka", getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  if (recipeQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Nalagam recept...</Text>
      </View>
    );
  }

  if (recipeQuery.isError) {
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

  const recipe = recipeQuery.data;
  const ingredients = recipe?.ingredients ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{recipe?.title}</Text>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("RecipeForm", { id })}
        >
          <Text style={styles.secondaryButtonText}>Uredi recept</Text>
        </Pressable>

        <Pressable style={styles.dangerButton} onPress={confirmDeleteRecipe}>
          <Text style={styles.dangerButtonText}>
            {deleteRecipeMutation.isPending ? "Brišem..." : "Izbriši"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Priprava</Text>
          <Text style={styles.metaValue}>
            {recipe?.prepTimeMinutes != null
              ? `${recipe.prepTimeMinutes} min`
              : recipe?.prep_time_minutes != null
                ? `${recipe.prep_time_minutes} min`
                : "-"}
          </Text>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Kuhanje</Text>
          <Text style={styles.metaValue}>
            {recipe?.cookTimeMinutes != null
              ? `${recipe.cookTimeMinutes} min`
              : recipe?.cook_time_minutes != null
                ? `${recipe.cook_time_minutes} min`
                : "-"}
          </Text>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Porcije</Text>
          <Text style={styles.metaValue}>{recipe?.servings ?? "-"}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Opis</Text>
        <Text style={styles.value}>{recipe?.description || "-"}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>Sestavine</Text>

          <Pressable
            style={styles.smallButton}
            onPress={() =>
              navigation.navigate("RecipeIngredientForm", { recipeId: id })
            }
          >
            <Text style={styles.smallButtonText}>+ Dodaj</Text>
          </Pressable>
        </View>

        {ingredients.length === 0 ? (
          <Text style={styles.emptyText}>Ni dodanih sestavin.</Text>
        ) : (
          <View style={styles.ingredientsList}>
            {ingredients.map((item, index) => {
              const key = String(item.id ?? item.ingredientId ?? index);
              const note = item.note?.trim();

              return (
                <View key={key} style={styles.ingredientRow}>
                  <View style={styles.ingredientTextBlock}>
                    <Text style={styles.ingredientText}>
                      {formatIngredientLine(item)}
                    </Text>

                    {note ? <Text style={styles.noteText}>{note}</Text> : null}
                  </View>

                  <View style={styles.ingredientActions}>
                    <Pressable
                      style={styles.inlineButton}
                      onPress={() =>
                        navigation.navigate("RecipeIngredientForm", {
                          recipeId: id,
                          recipeIngredient: item,
                        })
                      }
                    >
                      <Text style={styles.inlineButtonText}>Uredi</Text>
                    </Pressable>

                    <Pressable
                      style={styles.inlineDangerButton}
                      onPress={() => confirmDeleteIngredient(item)}
                    >
                      <Text style={styles.inlineDangerButtonText}>Briši</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Navodila</Text>
        <Text style={styles.value}>{recipe?.instructions || "-"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Vidnost</Text>
        <Text style={styles.value}>
          {Number(recipe?.isPublic ?? recipe?.is_public ?? 0) === 1
            ? "Javen recept"
            : "Zaseben recept"}
        </Text>
      </View>

      {recipe?.updatedAt || recipe?.updated_at ? (
        <Text style={styles.updated}>
          Zadnja sprememba: {recipe.updatedAt || recipe.updated_at}
        </Text>
      ) : null}
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#212529",
    marginBottom: 4,
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
  metaGrid: {
    flexDirection: "row",
    gap: 8,
  },
  metaCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  metaLabel: {
    color: "#6c757d",
    fontSize: 12,
    fontWeight: "700",
  },
  metaValue: {
    color: "#212529",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 17,
    fontWeight: "800",
    color: "#343a40",
  },
  value: {
    color: "#495057",
    lineHeight: 22,
  },
  emptyText: {
    color: "#868e96",
  },
  ingredientsList: {
    gap: 10,
  },
  ingredientRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
    gap: 8,
  },
  ingredientTextBlock: {
    gap: 4,
  },
  ingredientText: {
    color: "#212529",
    fontSize: 15,
    fontWeight: "600",
  },
  noteText: {
    color: "#6c757d",
    fontSize: 13,
  },
  ingredientActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallButton: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
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
  updated: {
    color: "#868e96",
    fontSize: 13,
    marginTop: 4,
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