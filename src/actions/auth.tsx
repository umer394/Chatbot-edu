"use server";

import { redirect } from "next/navigation";
import { FormState, SignupFormSchema } from "../lib/definition";
import bcrypt from "bcrypt";
import { createSession } from '../lib/session'
import { cookies } from "next/headers";

export async function signup(state:FormState, formData:FormData) {
    const validatedFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    })
    
    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
        }
    }
    const {name,email,password} = validatedFields.data
    const hashedPassword = await bcrypt.hash(password,10)
    const cookieStore = await cookies()
    
    // Method 1: Store individual form fields
    // cookieStore.set('user_name', name, {
    //     httpOnly: true,
    //     secure: true,
    //     maxAge: 60 * 60 * 24 * 7, // 7 days
    //     sameSite: 'lax'
    // })
    // cookieStore.set('user_email', email, {
    //     httpOnly: true,
    //     secure: true,
    //     maxAge: 60 * 60 * 24 * 7, // 7 days
    //     sameSite: 'lax'
    // })
    // cookieStore.set('password',hashedPassword,{
    //     httpOnly: true,
    //     secure: true,
    //     maxAge: 60 * 60 * 24 * 7, // 7 days
    //     sameSite: 'lax'
    // })
    // Method 2: Store as JSON (excluding sensitive data like password)
    const userData = {
        name,
        email,
        hashedPassword,
        timestamp: new Date().toISOString()
    }
    cookieStore.set('user_data', JSON.stringify(userData), {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax'
    })
    // const data = await db
    // .insert(users)
    // .values({
    //   name,
    //   email,
    //   password: hashedPassword,
    // })
    // .returning({ id: users.id })
 
    // const user = data[0]
 
    // if (!user) {
    //     return {
    //     message: 'An error occurred while creating your account.',
    //     }
    // }
 
  // TODO:
  // Current steps:
  // 4. Create user session
    // await createSession(user.id)
  // 5. Redirect user
    redirect('/')

}