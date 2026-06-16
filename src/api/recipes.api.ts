import { api } from "./client";
import type {
  Recipe,
  RecipeIngredient,
  RecipesListParams,
  RecipesListResponse,
} from "../types/recipe.types";

export type SaveRecipePayload = {
  title: string;
  description: string | null;
  instructions: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  isPublic: number;
};

export type SaveRecipeIngredientPayload = {
  ingredientId?: number | null;
  ingredientName?: string | null;
  quantity: number;
  unit: string | null;
  note: string | null;
};

export async function getRecipes(
  params: RecipesListParams
): Promise<RecipesListResponse> {
  const response = await api.get("/recipes", { params });
  const data = response.data?.data;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: typeof data?.total === "number" ? data.total : 0,
  };
}

export async function getRecipe(id: number): Promise<Recipe> {
  const response = await api.get(`/recipes/${id}`);
  const data = response.data?.data;

  const recipe = data?.recipe ?? data;

  if (!recipe) {
    throw new Error("Recipe response missing recipe.");
  }

  const ingredients = Array.isArray(data?.ingredients)
    ? data.ingredients
    : Array.isArray(recipe?.ingredients)
      ? recipe.ingredients
      : [];

  return {
    ...recipe,
    ingredients,
  };
}

export async function createRecipe(payload: SaveRecipePayload): Promise<Recipe> {
  const response = await api.post("/recipes", payload);
  const data = response.data?.data;
  return data?.recipe ?? data;
}

export async function updateRecipe(
  id: number,
  payload: SaveRecipePayload
): Promise<Recipe> {
  const response = await api.patch(`/recipes/${id}`, payload);
  const data = response.data?.data;
  return data?.recipe ?? data;
}

export async function deleteRecipe(id: number): Promise<void> {
  await api.delete(`/recipes/${id}`);
}

export async function createRecipeIngredient(
  recipeId: number,
  payload: SaveRecipeIngredientPayload
): Promise<RecipeIngredient> {
  const response = await api.post(`/recipes/${recipeId}/ingredients`, payload);
  const data = response.data?.data;
  return data?.ingredient ?? data?.item ?? data;
}

export async function updateRecipeIngredient(
  recipeId: number,
  recipeIngredientId: number,
  payload: Omit<SaveRecipeIngredientPayload, "ingredientId" | "ingredientName">
): Promise<RecipeIngredient> {
  const response = await api.patch(
    `/recipes/${recipeId}/ingredients/${recipeIngredientId}`,
    payload
  );

  const data = response.data?.data;
  return data?.ingredient ?? data?.item ?? data;
}

export async function deleteRecipeIngredient(
  recipeId: number,
  recipeIngredientId: number
): Promise<void> {
  await api.delete(`/recipes/${recipeId}/ingredients/${recipeIngredientId}`);
}