import { supabase } from "@/lib/supabase";
import {
  nowLocalInput,
  type TransactionFormValues,
  type TransactionType,
} from "./schema";
import { transactionEffectCentavos } from "./totals";

export type TransactionItem = {
  id: string;
  type: TransactionFormValues["type"];
  accountId: string;
  accountLabel: string;
  amount: string;
  fee: string;
  countFee: boolean;
  note?: string;
  timestamp: string;
  onHold: boolean;
  releasedAt?: string;
};

type StoredTransaction = {
  account_id: string;
  type: string;
  amount: string;
  fee: string;
  count_fee: boolean;
  note?: string;
  on_hold: boolean;
  released_at: string | null;
};

function toRow(values: TransactionFormValues) {
  return {
    account_id: values.accountId,
    type: values.type,
    amount: Number(values.amount),
    fee: Number(values.fee),
    count_fee: values.countFee,
    occurred_at: new Date(values.timestamp).toISOString(),
    note: values.note || null,
    on_hold: values.onHold,
  };
}

async function fetchStoredTransaction(id: string): Promise<StoredTransaction> {
  const { data, error } = await supabase
    .from("transactions")
    .select("account_id, type, amount::text, fee::text, count_fee, note")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Transaction not found");
  return data as StoredTransaction;
}

async function adjustAccountAmount(accountId: string, deltaCentavos: number) {
  if (deltaCentavos === 0) return;

  const { data, error } = await supabase
    .from("accounts")
    .select("amount::text")
    .eq("id", accountId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Account not found");

  const currentCentavos = Math.round(
    Number((data as { amount: string }).amount) * 100,
  );
  const nextCentavos = currentCentavos + deltaCentavos;

  const { error: updateError } = await supabase
    .from("accounts")
    .update({ amount: nextCentavos / 100 })
    .eq("id", accountId);
  if (updateError) throw updateError;
}

export async function createTransaction(values: TransactionFormValues) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(toRow(values))
    .select()
    .single();
  if (error) throw error;

  await adjustAccountAmount(
    values.accountId,
    transactionEffectCentavos(
      values.type,
      values.amount,
      values.fee,
      values.countFee,
    ),
  );

  return data;
}

export async function updateTransaction(
  id: string,
  values: TransactionFormValues,
) {
  const stored = await fetchStoredTransaction(id);

  const { data, error } = await supabase
    .from("transactions")
    .update(toRow(values))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  const oldEffect = transactionEffectCentavos(
    stored.type as TransactionType,
    stored.amount,
    stored.fee,
    stored.count_fee,
  );
  const newEffect = transactionEffectCentavos(
    values.type,
    values.amount,
    values.fee,
    values.countFee,
  );

  if (stored.account_id === values.accountId) {
    await adjustAccountAmount(values.accountId, newEffect - oldEffect);
  } else {
    await adjustAccountAmount(stored.account_id, -oldEffect);
    await adjustAccountAmount(values.accountId, newEffect);
  }

  return data;
}

export async function deleteTransaction(id: string) {
  const stored = await fetchStoredTransaction(id);

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;

  await adjustAccountAmount(
    stored.account_id,
    -transactionEffectCentavos(
      stored.type as TransactionType,
      stored.amount,
      stored.fee,
      stored.count_fee,
    ),
  );
}

export async function releaseTransaction(id: string) {
  const { data, error } = await supabase
    .from("transactions")
    .update({ on_hold: false, released_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

type TransactionRow = {
  id: string;
  account_id: string;
  type: string;
  amount: string | number;
  fee: string | number;
  count_fee: boolean;
  occurred_at: string;
  accounts: {
    nickname: string;
    providers: { name: string } | null;
  } | null;
  note?: string;
  on_hold: boolean;
  released_at: string | null;
};

export async function listTransactions({
  accountId,
  from,
  to,
}: {
  accountId?: string;
  from?: Date;
  to?: Date;
} = {}): Promise<TransactionItem[]> {
  let query = supabase.from("transactions").select(`
    id,
    account_id,
    type,
    amount::text,
    fee::text,
    count_fee,
    occurred_at,
    note,
    on_hold,
    released_at,
    accounts (
      nickname,
      providers (name)
    )
  `);
  if (accountId) {
    query = query.eq("account_id", accountId);
  }
  if (from) {
    query = query.gte("occurred_at", from.toISOString());
  }
  if (to) {
    query = query.lte("occurred_at", to.toISOString());
  }

  const { data, error } = await query.order("occurred_at", {
    ascending: false,
  });

  if (error) throw error;
  if (!data) return [];

  return (data as unknown as TransactionRow[]).map((row) => ({
    id: row.id,
    type: row.type as TransactionFormValues["type"],
    accountId: row.account_id,
    accountLabel:
      [row.accounts?.providers?.name, row.accounts?.nickname]
        .filter(Boolean)
        .join(" · ") || "Unknown",
    amount: String(row.amount),
    fee: String(row.fee),
    countFee: row.count_fee,
    timestamp: nowLocalInput(new Date(row.occurred_at)),
    note: row.note || undefined,
    onHold: row.on_hold,
    releasedAt: row.released_at
      ? nowLocalInput(new Date(row.released_at))
      : undefined,
  }));
}
