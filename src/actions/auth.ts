"use server";

import { FormState, SignupFormSchema } from "../lib/definition";
import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/session'
import bcrypt from "bcrypt";
export async function signup(state:FormState,formData: FormData) {
    // safeParse attempts to validate the incoming form data against SignupFormSchema.
    // It returns an object: { success: true, data: ... } if valid,
    // or { success: false, error: ... } if validation fails,
    // letting us handle errors gracefully without throwing.
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
  
  const { name, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // TODO: Save user to database
  // Example: await createUser({ name, email, password: hashedPassword })
  
  return {
    message: "User created successfully"
  };
}

export async function logout() {
  await deleteSession()
  // redirect('/login')
}