import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/**
 * Admin model (requirements §5.4). Seeded administrators only - no
 * self-registration endpoint exists. The plain password is never stored,
 * only its bcrypt hash. `role` drives RBAC (§1.4): admins soft-delete into
 * the Trash; only super admins purge it.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AdminFields {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "super-admin";
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<AdminFields>(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "E-mail is required."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_RE, "Enter a valid e-mail address."],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required."],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "super-admin"],
        message: "Role must be admin or super-admin.",
      },
      default: "admin",
    },
  },
  { timestamps: true }
);

export type AdminDocument = HydratedDocument<AdminFields>;

const AdminModel =
  (mongoose.models.Admin as Model<AdminFields> | undefined) ??
  mongoose.model<AdminFields>("Admin", adminSchema);

export default AdminModel;
