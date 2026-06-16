import * as SecureStore from "expo-secure-store";
import { env } from "./env";

const SERVER_URL_KEY = "moji_recepti_server_url";

let memoryServerUrl: string | null = null;

function normalizeServerUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export async function getServerBaseUrl(): Promise<string> {
  if (memoryServerUrl) {
    return memoryServerUrl;
  }

  const storedUrl = await SecureStore.getItemAsync(SERVER_URL_KEY);

  if (storedUrl) {
    memoryServerUrl = normalizeServerUrl(storedUrl);
    return memoryServerUrl;
  }

  memoryServerUrl = normalizeServerUrl(env.apiBaseUrl);
  return memoryServerUrl;
}

export async function saveServerBaseUrl(url: string): Promise<void> {
  const normalizedUrl = normalizeServerUrl(url);

  if (!normalizedUrl) {
    throw new Error("Server URL ne sme biti prazen.");
  }

  memoryServerUrl = normalizedUrl;
  await SecureStore.setItemAsync(SERVER_URL_KEY, normalizedUrl);
}

export async function resetServerBaseUrl(): Promise<void> {
  memoryServerUrl = normalizeServerUrl(env.apiBaseUrl);
  await SecureStore.deleteItemAsync(SERVER_URL_KEY);
}