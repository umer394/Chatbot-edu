import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
export async function POST(req: Request) {
  try {
    const { name, email, password,confirmPassword } = await req.json();

    if (!name || !email || !password || !confirmPassword) { 
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    if(password !== confirmPassword){
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // await connectDB();

    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return NextResponse.json(
    //     { error: "User already exists" },
    //     { status: 409 }
    //   );
    // }

    const hashedPassword = await bcrypt.hash(password, 10);
    // const newUser = await User.create({
    //   name,
    //   email,
    //   password: hashedPassword,
    //   role: "user",
    // });
    // return NextResponse.json({
    //   message: "User registered successfully",
    //   user: { name: newUser.name, email: newUser.email },
    // });
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
