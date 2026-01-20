import mongoose, { Schema, Document } from "mongoose";

export enum Role {
  "invalid" = 0,
  "teacher" = 1,
  "student" = 2,
}

export interface IUser extends Omit<Document, "_id"> {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

const userSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: Number, required: true, default: 0 },
  },
  {
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.__v;
        delete ret._id;
        return ret;
      },
    },
  }
);

export const User = mongoose.model("User", userSchema);
