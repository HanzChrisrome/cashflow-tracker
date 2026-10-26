import { supabase } from "@/lib/supabase";
import type { AccountFormValues } from "./schema";

export type Account = {
  id: string;
  providerId: string;
  nickname: string;
  ownerName: string;
  monthlyLimit: string;
  amount: string;
  isActive: boolean;
};

export type AccountListItem = {
  id: string;
  nickname: string;
  ownerName: string;
  monthlyLimit: string;
  amount: string;
  isActive: boolean;
  providerName: string;
};

type AccountRow = {
  id: string;
  nickname: string;
  owner_name: string;
  monthly_limit: string | number;
  amount: string | number;
  is_active: boolean;
  providers: { name: string } | null;
};

function toRow(values: AccountFormValues) {
  return {
    provider_id: values.providerId,
    nickname: values.nickname,
    owner_name: values.ownerName,
    monthly_limit: Number(values.monthlyLimit),
    amount: Number(values.amount),
    is_active: values.isActive,
  };
}

export async function createAccount(values: AccountFormValues) {
  const { data, error } = await supabase
    .from("accounts")
    .insert(toRow(values))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(id: string, values: AccountFormValues) {
  const { data, error } = await supabase
    .from("accounts")
    .update(toRow(values))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAccount(id: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select(
      "id, provider_id, nickname, owner_name, monthly_limit::text, amount::text, is_active",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as {
    id: string;
    provider_id: string;
    nickname: string;
    owner_name: string;
    monthly_limit: string;
    amount: string;
    is_active: boolean;
  };
  return {
    id: row.id,
    providerId: row.provider_id,
    nickname: row.nickname,
    ownerName: row.owner_name,
    monthlyLimit: row.monthly_limit,
    amount: row.amount,
    isActive: row.is_active,
  };
}

export async function listAccounts(): Promise<AccountListItem[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select(
      "id, nickname, owner_name, monthly_limit::text, amount::text, is_active, providers(name)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data) return [];
  return (data as unknown as AccountRow[]).map((row) => ({
    id: row.id,
    nickname: row.nickname,
    ownerName: row.owner_name,
    monthlyLimit: String(row.monthly_limit),
    amount: String(row.amount),
    isActive: row.is_active,
    providerName: row.providers?.name ?? "Unknown",
  }));
}
