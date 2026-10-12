import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/**
 * Customer model (requirements §5.2).
 * Validators mirror the shared zod schema (NFR-5) so client and server
 * always agree; balances are never stored here - they are derived from
 * the transaction ledger (§5.1).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d+\-\s()]{6,20}$/;

export interface CustomerFields {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status: "active" | "archived";
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
    phone: {
      type: String,
      required: [true, "Phone is required."],
      unique: true, // creates the { phone: 1 } unique index (§5.2)
      trim: true,
      match: [PHONE_RE, "Use digits, spaces, + and - only."],
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
  },
  { timestamps: true }
);

customerSchema.index({ name: "text" });

export type CustomerDocument = HydratedDocument<CustomerFields>;

const CustomerModel =
  (mongoose.models.Customer as Model<CustomerFields> | undefined) ??
  mongoose.model<CustomerFields>("Customer", customerSchema);

export default CustomerModel;
