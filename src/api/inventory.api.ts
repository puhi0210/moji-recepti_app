import { api } from "./client";
import type {
  InventoryItem,
  InventoryListParams,
  InventoryListResponse,
} from "../types/inventory.types";

export type SaveInventoryItemPayload = {
  ingredientId: number | null;
  customName: string | null;
  quantity: number;
  unit: string;
  location: string;
  expiresAt: string | null;
  minQuantity: number | null;
};

export async function getInventoryItems(
  params: InventoryListParams
): Promise<InventoryListResponse> {
  const response = await api.get("/inventory/items", { params });
  const data = response.data?.data;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: typeof data?.total === "number" ? data.total : 0,
  };
}

export async function getInventoryItem(id: number): Promise<InventoryItem> {
  const response = await api.get(`/inventory/items/${id}`);
  const data = response.data?.data;

  return data?.item ?? data;
}

export async function createInventoryItem(
  payload: SaveInventoryItemPayload
): Promise<InventoryItem> {
  const response = await api.post("/inventory/items", payload);
  const data = response.data?.data;

  return data?.item ?? data;
}

export async function updateInventoryItem(
  id: number,
  payload: SaveInventoryItemPayload
): Promise<InventoryItem> {
  const response = await api.patch(`/inventory/items/${id}`, payload);
  const data = response.data?.data;

  return data?.item ?? data;
}

export async function deleteInventoryItem(id: number): Promise<void> {
  await api.delete(`/inventory/items/${id}`);
}