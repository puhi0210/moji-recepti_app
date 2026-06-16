import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getApiErrorMessage } from "../../api/client";
import { getRecipes } from "../../api/recipes.api";
import { useDebounce } from "../../hooks/useDebounce";
import type { Recipe } from "../../types/recipe.types";
import type { RecipesStackParamList } from "../../navigation/RecipesStack";

type Props = NativeStackScreenProps<RecipesStackParamList, "RecipesList">;

const PAGE_SIZE = 20;

export function RecipesListScreen({ navigation }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const recipesQuery = useQuery({
    queryKey: ["recipes", { search: debouncedSearch, page, pageSize: PAGE_SIZE }],
    queryFn: () =>
      getRecipes({
        search: debouncedSearch.trim(),
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const recipes = recipesQuery.data?.items ?? [];
  const total = recipesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function renderRecipe({ item }: { item: Recipe }) {
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("RecipeDetail", { id: item.id })}
      >
        <Text style={styles.recipeTitle}>{item.title}</Text>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Porcije: {item.servings ?? "-"}</Text>
          {item.updated_at || item.updatedAt ? (
            <Text style={styles.metaText}>
              {item.updated_at || item.updatedAt}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Recepti</Text>
          <Text style={styles.subtitle}>Skupaj: {total}</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate("RecipeForm")}
        >
          <Text style={styles.addButtonText}>+ Dodaj</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Išči recepte..."
        placeholderTextColor="#868e96"
        value={search}
        onChangeText={handleSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {recipesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.centerText}>Nalagam recepte...</Text>
        </View>
      ) : recipesQuery.isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Napaka pri nalaganju</Text>
          <Text style={styles.errorText}>
            {getApiErrorMessage(recipesQuery.error)}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => recipesQuery.refetch()}
          >
            <Text style={styles.retryButtonText}>Poskusi znova</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={recipes}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderRecipe}
            contentContainerStyle={
              recipes.length === 0 ? styles.emptyList : styles.list
            }
            refreshControl={
              <RefreshControl
                refreshing={recipesQuery.isRefetching}
                onRefresh={recipesQuery.refetch}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>Ni receptov</Text>
                <Text style={styles.centerText}>
                  {debouncedSearch
                    ? "Za ta iskalni niz ni rezultatov."
                    : "Trenutno ni dodanih receptov."}
                </Text>
              </View>
            }
          />

          <View style={styles.pagination}>
            <Pressable
              style={[styles.pageButton, page <= 1 && styles.disabledButton]}
              disabled={page <= 1}
              onPress={() => setPage((currentPage) => currentPage - 1)}
            >
              <Text style={styles.pageButtonText}>Prejšnja</Text>
            </Pressable>

            <Text style={styles.pageText}>
              {page} / {totalPages}
            </Text>

            <Pressable
              style={[
                styles.pageButton,
                page >= totalPages && styles.disabledButton,
              ]}
              disabled={page >= totalPages}
              onPress={() => setPage((currentPage) => currentPage + 1)}
            >
              <Text style={styles.pageButtonText}>Naslednja</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  headerRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#212529",
  },
  subtitle: {
    color: "#6c757d",
    marginTop: 2,
  },
  addButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#212529",
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  description: {
    color: "#495057",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaText: {
    color: "#868e96",
    fontSize: 12,
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
  retryButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    gap: 12,
  },
  pageButton: {
    minHeight: 42,
    minWidth: 110,
    borderRadius: 10,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  pageText: {
    color: "#495057",
    fontWeight: "700",
  },
});