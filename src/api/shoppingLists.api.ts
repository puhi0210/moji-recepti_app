import { api } from "./client";
import type {
  ShoppingList,
  ShoppingListItemsResponse,
  ShoppingListItem,
  ShoppingListsParams,
  ShoppingListsResponse,
} from "../types/shoppingList.types";

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
  payload: Partial<ShoppingListItem>
): Promise<ShoppingListItem> {
  const response = await api.post(`/shopping-lists/${listId}/items`, payload);
  const data = response.data?.data;

  return data?.item ?? data;
}