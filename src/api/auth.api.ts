import { api } from "./client";
import type {
  AuthUser,
  LoginRequest,
  LoginResponseData,
} from "../types/auth.types";

export async function loginRequest(
  payload: LoginRequest
): Promise<LoginResponseData> {
  const response = await api.post("/auth/login", payload);

  const data = response.data?.data;

  if (!data?.tokens?.accessToken || !data?.tokens?.refreshToken) {
    throw new Error("Login response missing tokens.");
  }

  return data;
}

export async function meRequest(): Promise<AuthUser> {
  const response = await api.get("/auth/me");
  return response.data?.data;
}