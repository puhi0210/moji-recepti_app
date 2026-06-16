export type InventoryItem = {
  id: number;
  ingredientId?: number | null;
  ingredient_id?: number | null;

  ingredientName?: string | null;
  ingredient_name?: string | null;
  customName?: string | null;
  custom_name?: string | null;

  quantity?: number | string | null;
  unit?: string | null;
  location?: string | null;

  minQuantity?: number | string | null;
  min_quantity?: number | string | null;

  expiresAt?: string | null;
  expires_at?: string | null;

  updatedAt?: string | null;
  updated_at?: string | null;
};

export type InventoryListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
  location?: string;
  lowStockOnly?: boolean;
  expiresBefore?: string;
};

export type InventoryListResponse = {
  items: InventoryItem[];
  total: number;
};