import { api } from "./client";
import type {
  Recipe,
  RecipesListParams,
  RecipesListResponse,
} from "../types/recipe.types";

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