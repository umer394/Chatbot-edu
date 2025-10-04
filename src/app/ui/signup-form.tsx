"use client";

import { signup } from "../actions/auth";
import { useActionState } from "react";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <form action={action} className="grid grid-cols-1 justify-center items-center">
      <div>
        <label htmlFor="name" >Name</label>
        <input id="name" name="name"  className="p-2 border-2" placeholder="Name" />
      </div>
      {state?.errors?.name && <p>{state.errors.name}</p> }
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email"  className="p-2 border-2" placeholder="Email" />
      </div>
      {state?.errors?.email && <p>{state.errors.email}</p> }
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" className="p-2 border-2" placeholder="Password" />
      </div>
      {state?.errors?.password && (
        <div>
          <p>Password must:</p>
          <ul>
            {state.errors.password.map((error) => (
              <li key={error}>- {error}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" className="p-2 border-2" placeholder="Password" />
      </div>
      <button disabled={pending} className="bg-red-600 w-20 p-2 mt-4 ml-10" type="submit">
        Sign Up
      </button>
    </form>
  );
}
