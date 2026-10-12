/**
 * Standalone API error so session helpers (and the proxy) can throw typed
 * errors without dragging the mongoose-aware api.ts into their bundles.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
