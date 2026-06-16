import { api } from "./client";
import type {
  InventoryItem,
  InventoryListParams,
  InventoryListResponse,
} from "../types/inventory.types";

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