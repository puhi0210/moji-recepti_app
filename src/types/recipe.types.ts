export type RecipeIngredient = {
  id?: number;
  ingredientId?: number | null;
  ingredient_id?: number | null;
  ingredientName?: string | null;
  ingredient_name?: string | null;
  name?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
  note?: string | null;
};

export type Recipe = {
  id: number;
  title: string;

  description?: string | null;
  instructions?: string | null;

  prepTimeMinutes?: number | null;
  prep_time_minutes?: number | null;

  cookTimeMinutes?: number | null;
  cook_time_minutes?: number | null;

  servings?: number | null;

  isPublic?: number | boolean | null;
  is_public?: number | boolean | null;

  updatedAt?: string | null;
  updated_at?: string | null;

  ingredients?: RecipeIngredient[];
};

export type RecipesListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type RecipesListResponse = {
  items: Recipe[];
  total: number;
};