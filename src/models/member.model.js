import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    dob: { type: Date, required: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

memberSchema.index({ userId: 1, name: 1, relation: 1, isDeleted: 1 });

export const Member = mongoose.model("Member", memberSchema);


