import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/**
 * Customer model (requirements §5.2).
 * Validators mirror the shared zod schema (NFR-5) so client and server
 * always agree; balances are never stored here - they are derived from
 * the transaction ledger (§5.1).
 *
 * phone and customerCode are unique-but-optional (sparse): many real
 * master-sheet customers carry no phone, and codes only exist once
 * generated/imported.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d+\-\s()]{6,20}$/;

export interface CustomerFields {
  name: string;
  customerCode?: string;
  phone?: string;
  businessName?: string;
  alternativePhone?: string;
  email?: string;
  address?: string;
  area?: string;
  businessType?: "workshop" | "contractor" | "retail-shop" | "company" | "individual";
  customerCategory?: string;
  customerSince?: Date;
  riskLevel?: "low" | "medium" | "high" | "critical";
  recoveryStatus?:
    | "not-contacted"
    | "contacted"
    | "promise-made"
    | "partial-payment"
    | "completed"
    | "refused"
    | "disputed"
    | "legal-action";
  notes?: string;
  status: "active" | "archived";
  /** Soft-delete marker (§5.7): set = the customer is in the Trash. */
  deletedAt?: Date;
  /** Who soft-deleted the customer (audit). */
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<CustomerFields>(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name needs at least 2 characters."],
      maxlength: [80, "Keep the name under 80 characters."],
    },
    customerCode: {
      type: String,
      // Uniqueness comes from the sparse index below (one spec per key only).
      trim: true,
      uppercase: true,
      maxlength: [12, "Keep the customer code under 12 characters."],
      default: undefined,
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_RE, "Use digits, spaces, + and - only."],
      default: undefined,
    },
    businessName: {
      type: String,
      trim: true,
      maxlength: [120, "Keep the business name under 120 characters."],
      default: undefined,
    },
    alternativePhone: {
      type: String,
      trim: true,
      maxlength: [20, "Keep the alternative phone under 20 characters."],
      match: [PHONE_RE, "Alternative phone: use digits, spaces, + and - only."],
      default: undefined,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [EMAIL_RE, "Enter a valid e-mail address."],
      default: undefined,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [240, "Keep the address under 240 characters."],
      default: undefined,
    },
    area: {
      type: String,
      trim: true,
      maxlength: [120, "Keep the area under 120 characters."],
      default: undefined,
    },
    businessType: {
      type: String,
      enum: {
        values: ["workshop", "contractor", "retail-shop", "company", "individual"],
        message: "Business type must be workshop, contractor, retail-shop, company or individual.",
      },
      default: undefined,
    },
    customerCategory: {
      type: String,
      trim: true,
      maxlength: [40, "Keep the category under 40 characters."],
      default: undefined,
    },
    customerSince: {
      type: Date,
      default: undefined,
    },
    riskLevel: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "critical"],
        message: "Risk level must be low, medium, high or critical.",
      },
      default: undefined,
    },
    recoveryStatus: {
      type: String,
      enum: {
        values: [
          "not-contacted",
          "contacted",
          "promise-made",
          "partial-payment",
          "completed",
          "refused",
          "disputed",
          "legal-action",
        ],
        message: "Recovery status is not one of the known values.",
      },
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Keep notes under 500 characters."],
      default: undefined,
    },
    status: {
      type: String,
      enum: { values: ["active", "archived"], message: "Status must be active or archived." },
      default: "active",
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: undefined,
    },
  },
  { timestamps: true }
);

customerSchema.index({ name: "text" });
// Sparse uniques: several real customers have no phone / no code yet.
customerSchema.index({ phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ customerCode: 1 }, { unique: true, sparse: true });

export type CustomerDocument = HydratedDocument<CustomerFields>;

const CustomerModel =
  (mongoose.models.Customer as Model<CustomerFields> | undefined) ??
  mongoose.model<CustomerFields>("Customer", customerSchema);

export default CustomerModel;
