export type RecipeIngredient = {
  id?: number;
  ingredientId?: number;
  ingredientName?: string | null;
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
  servings?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  is_public?: number | boolean | null;
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