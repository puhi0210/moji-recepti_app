export type ShoppingList = {
  id: number;
  name: string;
  status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
};

export type ShoppingListItem = {
  id: number;
  shoppingListId?: number | null;
  shopping_list_id?: number | null;

  ingredientId?: number | null;
  ingredient_id?: number | null;

  ingredientName?: string | null;
  ingredient_name?: string | null;
  customName?: string | null;
  custom_name?: string | null;

  quantity?: number | string | null;
  unit?: string | null;

  isChecked?: boolean | number | null;
  is_checked?: boolean | number | null;

  note?: string | null;
};

export type ShoppingListsParams = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type ShoppingListsResponse = {
  items: ShoppingList[];
  total: number;
};

export type ShoppingListItemsResponse = {
  items: ShoppingListItem[];
  total: number;
};