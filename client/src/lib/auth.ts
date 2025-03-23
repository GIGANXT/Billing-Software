import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";

export interface User {
  id: number;
  username: string;
  name: string;
  role: "admin" | "pharmacist" | "accountant";
  createdAt: string;
}

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "pharmacist", "accountant"]),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export async function login(data: LoginFormData): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/login", data);
  const user = await res.json();
  return user;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
  queryClient.clear();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
    });
    
    if (res.status === 401) {
      return null;
    }
    
    await throwIfResNotOk(res);
    return await res.json();
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
