import type {
  Admin,
  Customer,
  CustomerDetail,
  CustomerWithDue,
  OverviewStats,
  Paginated,
  TransactionWithCustomer,
  TransactionsPage,
} from "@/types";

/**
 * Typed client for the v2 API (requirements §6). Unwraps the
 * `{ success, data }` envelope and turns failures into ApiClientError
 * so Views can `toast.error(err.message)` with the server's wording.
 */

export class ApiClientError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

/** Human-readable message for any thrown value (network, API, unknown). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong - try again.";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError(0, "Network error - check your connection and try again.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    /* empty body */
  }
  const envelope = payload as { success?: boolean; data?: T; message?: string } | null;

  if (!response.ok || !envelope?.success) {
    throw new ApiClientError(
      response.status,
      envelope?.message ?? "Something went wrong - try again."
    );
  }
  return envelope.data as T;
}

/** Build a query string, skipping empty/undefined values. */
function qs(params: object): string {
  const entries = Object.entries(params as Record<string, unknown>).filter(
    (entry): entry is [string, string | number | boolean] =>
      (entry[1] !== undefined && entry[1] !== "") || typeof entry[1] === "boolean"
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export interface CustomerListParams {
  search?: string;
  status?: "active" | "archived" | "all";
  page?: number;
  limit?: number;
}

export interface TransactionListParams {
  customerId?: string;
  type?: "lend" | "repayment";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface TransactionInput {
  customerId: string;
  type: "lend" | "repayment";
  amount: number;
  date: string;
  method: "cash" | "bank" | "mobile-banking" | "other";
  note?: string;
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    request<{ admin: Admin }>("POST", "/api/auth/login", { email, password }),
  logout: () => request<{ loggedOut: boolean }>("POST", "/api/auth/logout"),
  me: () => request<{ admin: Admin }>("GET", "/api/auth/me"),

  // customers
  listCustomers: (params: CustomerListParams) =>
    request<Paginated<CustomerWithDue>>("GET", `/api/customers${qs(params)}`),
  createCustomer: (input: CustomerInput) =>
    request<CustomerWithDue>("POST", "/api/customers", input),
  getCustomer: (id: string) => request<CustomerDetail>("GET", `/api/customers/${id}`),
  updateCustomer: (id: string, patch: Partial<CustomerInput>) =>
    request<Customer>("PATCH", `/api/customers/${id}`, patch),
  deleteCustomer: (id: string) =>
    request<{ id: string; transactionsDeleted: number }>("DELETE", `/api/customers/${id}`),

  // transactions
  listTransactions: (params: TransactionListParams) =>
    request<TransactionsPage>("GET", `/api/transactions${qs(params)}`),
  createTransaction: (input: TransactionInput) =>
    request<TransactionWithCustomer>("POST", "/api/transactions", input),
  updateTransaction: (id: string, patch: Partial<TransactionInput>) =>
    request<TransactionWithCustomer>("PATCH", `/api/transactions/${id}`, patch),
  deleteTransaction: (id: string) =>
    request<{ id: string }>("DELETE", `/api/transactions/${id}`),

  // aggregates
  dues: (params: { search?: string; onlyWithDue?: boolean }) =>
    request<CustomerWithDue[]>("GET", `/api/dues${qs(params)}`),
  overview: () => request<OverviewStats>("GET", "/api/overview"),
};
