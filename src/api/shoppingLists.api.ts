import { api } from "./client";
import type {
  ShoppingList,
  ShoppingListItemsResponse,
  ShoppingListItem,
  ShoppingListsParams,
  ShoppingListsResponse,
} from "../types/shoppingList.types";

export type SaveShoppingListPayload = {
  name: string;
  status: string;
};

export type SaveShoppingListItemPayload = {
  ingredientId: number | null;
  customName: string | null;
  quantity: number | null;
  unit: string | null;
  note?: string | null;
};

export async function getShoppingLists(
  params: ShoppingListsParams
): Promise<ShoppingListsResponse> {
  const response = await api.get("/shopping-lists", { params });
  const data = response.data?.data;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: typeof data?.total === "number" ? data.total : 0,
  };
}

export async function getShoppingList(id: number): Promise<ShoppingList> {
  const response = await api.get(`/shopping-lists/${id}`);
  const data = response.data?.data;

  return data?.list ?? data?.shoppingList ?? data;
}

export async function createShoppingList(
  payload: SaveShoppingListPayload
): Promise<ShoppingList> {
  const response = await api.post("/shopping-lists", payload);
  const data = response.data?.data;

  return data?.list ?? data?.shoppingList ?? data;
}

export async function updateShoppingList(
  id: number,
  payload: SaveShoppingListPayload
): Promise<ShoppingList> {
  const response = await api.patch(`/shopping-lists/${id}`, payload);
  const data = response.data?.data;

  return data?.list ?? data?.shoppingList ?? data;
}

export async function deleteShoppingList(id: number): Promise<void> {
  await api.delete(`/shopping-lists/${id}`);
}

export async function getShoppingListItems(
  listId: number,
  params?: { page?: number; pageSize?: number }
): Promise<ShoppingListItemsResponse> {
  const response = await api.get(`/shopping-lists/${listId}/items`, {
    params,
  });

  const data = response.data?.data;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: typeof data?.total === "number" ? data.total : 0,
  };
}

export async function createShoppingListItem(
  listId: number,
  payload: SaveShoppingListItemPayload
): Promise<ShoppingListItem> {
  const response = await api.post(`/shopping-lists/${listId}/items`, payload);
  const data = response.data?.data;

  return data?.item ?? data;
}

export async function updateShoppingListItem(
  listId: number,
  itemId: number,
  payload: Partial<SaveShoppingListItemPayload> & {
    isChecked?: number | boolean;
  }
): Promise<ShoppingListItem> {
  const response = await api.patch(
    `/shopping-lists/${listId}/items/${itemId}`,
    payload
  );

  const data = response.data?.data;
  return data?.item ?? data;
}

export async function deleteShoppingListItem(
  listId: number,
  itemId: number
): Promise<void> {
  await api.delete(`/shopping-lists/${listId}/items/${itemId}`);
}

export async function clearCheckedShoppingListItems(
  listId: number
): Promise<void> {
  await api.post(`/shopping-lists/${listId}/items:clearChecked`);
}