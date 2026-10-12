import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/**
 * Transaction model (requirements §5.3) - the append-only ledger.
 * `amount` is a positive Decimal128; the sign of a ledger row comes from
 * `type` (lend = out, repayment = in), never from the stored value.
 */

export interface TransactionFields {
  customerId: mongoose.Types.ObjectId;
  type: "lend" | "repayment";
  amount: mongoose.Types.Decimal128;
  date: Date;
  method: "cash" | "bank" | "mobile-banking" | "other";
  note?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionFields>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required."],
    },
    type: {
      type: String,
      enum: { values: ["lend", "repayment"], message: "Type must be lend or repayment." },
      required: [true, "Type is required."],
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, "Amount is required."],
      validate: {
        validator: (value: unknown) => {
          const n = Number(value);
          return Number.isFinite(n) && n > 0 && n <= 99_999_999;
        },
        message: "Amount must be greater than zero and at most 99,999,999.",
      },
    },
    date: {
      type: Date,
      required: [true, "Date is required."],
      default: () => new Date(),
    },
    method: {
      type: String,
      enum: {
        values: ["cash", "bank", "mobile-banking", "other"],
        message: "Method must be cash, bank, mobile-banking or other.",
      },
      default: "cash",
    },
    note: {
      type: String,
      trim: true,
      maxlength: [240, "Keep the note under 240 characters."],
      default: undefined,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Created-by is required."],
    },
  },
  { timestamps: true }
);

transactionSchema.index({ customerId: 1, date: -1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1 });

export type TransactionDocument = HydratedDocument<TransactionFields>;

const TransactionModel =
  (mongoose.models.Transaction as Model<TransactionFields> | undefined) ??
  mongoose.model<TransactionFields>("Transaction", transactionSchema);

export default TransactionModel;
