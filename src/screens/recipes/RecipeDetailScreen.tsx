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
import { getRecipe } from "../../api/recipes.api";
import type { RecipesStackParamList } from "../../navigation/RecipesStack";
import type { RecipeIngredient } from "../../types/recipe.types";

type Props = NativeStackScreenProps<RecipesStackParamList, "RecipeDetail">;

function formatIngredientLine(item: RecipeIngredient): string {
  const name = item.ingredientName || item.name || "Sestavina";

  const quantity =
    item.quantity !== null && item.quantity !== undefined
      ? String(item.quantity)
      : "";

  const unit = item.unit || "";
  const amount = `${quantity} ${unit}`.trim();

  return amount ? `${name} — ${amount}` : name;
}

export function RecipeDetailScreen({ route }: Props) {
  const { id } = route.params;

  const recipeQuery = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => getRecipe(id),
  });

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

      <View style={styles.metaGrid}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Priprava</Text>
          <Text style={styles.metaValue}>
            {recipe?.prep_time_minutes != null
              ? `${recipe.prep_time_minutes} min`
              : "-"}
          </Text>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Kuhanje</Text>
          <Text style={styles.metaValue}>
            {recipe?.cook_time_minutes != null
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
        <Text style={styles.label}>Sestavine</Text>

        {ingredients.length === 0 ? (
          <Text style={styles.emptyText}>Ni dodanih sestavin.</Text>
        ) : (
          <View style={styles.ingredientsList}>
            {ingredients.map((item, index) => {
              const key = String(item.id ?? item.ingredientId ?? index);
              const note = item.note?.trim();

              return (
                <View key={key} style={styles.ingredientRow}>
                  <Text style={styles.ingredientText}>
                    {formatIngredientLine(item)}
                  </Text>

                  {note ? <Text style={styles.noteText}>{note}</Text> : null}
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

      {recipe?.updated_at ? (
        <Text style={styles.updated}>Zadnja sprememba: {recipe.updated_at}</Text>
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
  },
  ingredientText: {
    color: "#212529",
    fontSize: 15,
    fontWeight: "600",
  },
  noteText: {
    color: "#6c757d",
    fontSize: 13,
    marginTop: 4,
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