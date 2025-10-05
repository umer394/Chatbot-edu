import mongoose, { Document, models, Schema } from "mongoose";

export interface IUSer extends Document {
    name:string;
    email:string;
    password:string;
    role:string;
}

const UserSchema = new Schema<IUSer>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
});

const User = models.User || mongoose.model<IUSer>("User", UserSchema);
export default User;
