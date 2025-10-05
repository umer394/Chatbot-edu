import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

// Add pre-save middleware to ensure fields are set
UserSchema.pre('save', function(next) {
  if (!this.userId) {
    this.userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  next();
});

// Prevent recompiling model on hot reload in Next.js
const User = models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
