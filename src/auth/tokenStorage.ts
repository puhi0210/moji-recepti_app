import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "../types/auth.types";

const ACCESS_TOKEN_KEY = "moji_recepti_access_token";
const REFRESH_TOKEN_KEY = "moji_recepti_refresh_token";

let memoryTokens: AuthTokens | null = null;

export async function getTokens(): Promise<AuthTokens | null> {
  if (memoryTokens) return memoryTokens;

  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  memoryTokens = { accessToken, refreshToken };
  return memoryTokens;
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens?.refreshToken ?? null;
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  memoryTokens = tokens;

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  memoryTokens = null;

  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}