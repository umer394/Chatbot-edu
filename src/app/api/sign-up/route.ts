import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function generateUserId(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const { name, email, password, confirmPassword ,createdAt} = await req.json();
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Generate 4-char alphanumeric ID
    const userId = generateUserId();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with explicit fields
    const userData = {
      userId,
      name,
      email,
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
    };

    const newUser = new User(userData);
    await newUser.save();
    
    // Convert to plain object to ensure all fields are accessible
    const userObject = newUser.toObject();
    
    // Return response in your required format
    const userResponse = {
      _id: userObject._id.toString(),
      userId: userObject.userId,
      name: userObject.name,
      email: userObject.email,
      role: userObject.role,
      createdAt: userObject.createdAt.toISOString(),
      __v: userObject.__v,
    };

    return NextResponse.json(
      { message: "User registered successfully", user: userResponse },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
