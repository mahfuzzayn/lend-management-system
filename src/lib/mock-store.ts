"use client";

import { useSyncExternalStore } from "react";

import type {
  Customer,
  CustomerStatus,
  PaymentMethod,
  Transaction,
  TransactionType,
} from "../types";
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS } from "./mock-data";

/**
 * v1 in-memory store with pub/sub - gives every page live CRUD against the
 * mock dataset (§14.1 requires create/edit/delete to function). Deleted in v2
 * when the API + React Query-style fetching take over.
 */

export interface MockStoreState {
  customers: Customer[];
  transactions: Transaction[];
}

let state: MockStoreState = {
  customers: MOCK_CUSTOMERS,
  transactions: MOCK_TRANSACTIONS,
};
const listeners = new Set<() => void>();
let seq = 100; // new ids start above the seeded range

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): MockStoreState {
  return state;
}

export function useMockStore(): MockStoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export interface CustomerCreateInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface CustomerUpdateInput extends Partial<CustomerCreateInput> {
  status?: CustomerStatus;
}

export interface TransactionInput {
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  method: PaymentMethod;
  note?: string;
}

const nowIso = () => new Date().toISOString();

export function createCustomer(input: CustomerCreateInput): Customer {
  const customer: Customer = {
    id: `c-${++seq}`,
    name: input.name,
    phone: input.phone,
    email: input.email || undefined,
    address: input.address || undefined,
    notes: input.notes || undefined,
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state = { ...state, customers: [customer, ...state.customers] };
  emit();
  return customer;
}

export function updateCustomer(
  id: string,
  input: CustomerUpdateInput
): Customer | null {
  let updated: Customer | null = null;
  state = {
    ...state,
    customers: state.customers.map((customer) => {
      if (customer.id !== id) return customer;
      updated = {
        ...customer,
        ...("name" in input ? { name: input.name! } : {}),
        ...("phone" in input ? { phone: input.phone! } : {}),
        ...("email" in input ? { email: input.email || undefined } : {}),
        ...("address" in input ? { address: input.address || undefined } : {}),
        ...("notes" in input ? { notes: input.notes || undefined } : {}),
        ...("status" in input ? { status: input.status! } : {}),
        updatedAt: nowIso(),
      };
      return updated;
    }),
  };
  emit();
  return updated;
}

/** Deleting a customer permanently removes their transactions (cascade). */
export function deleteCustomerCascade(id: string): { transactionsRemoved: number } {
  const transactionsRemoved = state.transactions.filter(
    (t) => t.customerId === id
  ).length;
  state = {
    customers: state.customers.filter((c) => c.id !== id),
    transactions: state.transactions.filter((t) => t.customerId !== id),
  };
  emit();
  return { transactionsRemoved };
}

export function createTransaction(input: TransactionInput): Transaction {
  const transaction: Transaction = {
    id: `t-${++seq}`,
    customerId: input.customerId,
    type: input.type,
    amount: input.amount,
    date: input.date,
    method: input.method,
    note: input.note || undefined,
    createdAt: nowIso(),
  };
  state = { ...state, transactions: [transaction, ...state.transactions] };
  emit();
  return transaction;
}

export function updateTransaction(
  id: string,
  input: Partial<TransactionInput>
): Transaction | null {
  let updated: Transaction | null = null;
  state = {
    ...state,
    transactions: state.transactions.map((t) => {
      if (t.id !== id) return t;
      updated = {
        ...t,
        ...("customerId" in input ? { customerId: input.customerId! } : {}),
        ...("type" in input ? { type: input.type! } : {}),
        ...("amount" in input ? { amount: input.amount! } : {}),
        ...("date" in input ? { date: input.date! } : {}),
        ...("method" in input ? { method: input.method! } : {}),
        ...("note" in input ? { note: input.note || undefined } : {}),
        createdAt: t.createdAt,
      };
      return updated;
    }),
  };
  emit();
  return updated;
}

export function deleteTransaction(id: string): boolean {
  const before = state.transactions.length;
  state = { ...state, transactions: state.transactions.filter((t) => t.id !== id) };
  const removed = before !== state.transactions.length;
  if (removed) emit();
  return removed;
}

/** Restore the seeded dataset (useful while reviewing v1). */
export function resetMockStore() {
  state = { customers: MOCK_CUSTOMERS, transactions: MOCK_TRANSACTIONS };
  emit();
}
