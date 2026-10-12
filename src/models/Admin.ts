import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/**
 * Admin model (requirements §5.4). Single seeded administrator -
 * no self-registration endpoint exists. The plain password is never
 * stored, only its bcrypt hash.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AdminFields {
  name: string;
  email: string;
  passwordHash: string;
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
  },
  { timestamps: true }
);

export type AdminDocument = HydratedDocument<AdminFields>;

const AdminModel =
  (mongoose.models.Admin as Model<AdminFields> | undefined) ??
  mongoose.model<AdminFields>("Admin", adminSchema);

export default AdminModel;
