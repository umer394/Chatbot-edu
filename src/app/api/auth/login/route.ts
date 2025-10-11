import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
export async function POST(req: Request){
    try{
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        
        await connectDB();
        const allUsers = await User.find({});
        const user = await User.findOne({ 
            email: { $regex: new RegExp(`^${email}$`, 'i') } 
        });
       
        
        if (!user) {
            console.log("No user found for email:", email);
            return NextResponse.json(
                { error: "User not found" },
                { status: 401 }
            );
         }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      // { expiresIn: "1h" } 
    );

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,   
      secure: process.env.NODE_ENV === "production", 
      sameSite: "strict",
      // maxAge: 0, 
      // path: "/",
    });

    return response;

    }catch(err){
        console.error("Login error:", err);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
    }
}