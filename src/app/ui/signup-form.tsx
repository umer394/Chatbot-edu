"use client";

import { useState } from "react";



export function SignupForm() {
   const [form, setForm] = useState({ name: "", email: "", password: "" ,confirmPassword:""});
  const [message, setMessage] = useState("");
  const handleSubmit = async(e:React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/sign-up",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(form)
    })
  }
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 justify-center items-center">
      <div>
        <label htmlFor="name">Name</label>
        <input type="name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})}  className="p-2 border-2" placeholder="Name" />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})}  className="p-2 border-2" placeholder="Email" />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input  type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})}   className="p-2 border-2" placeholder="Password" />
      </div>
      <div>
        <label htmlFor="password">Confirm Password</label>
        <input type="password" value={form.confirmPassword} onChange={(e)=>setForm({...form, confirmPassword:e.target.value})}  className="p-2 border-2" placeholder="Confirm Password" />
      </div>
      <button type="submit" className="bg-red-600 w-20 p-2 mt-4 ml-10" >
        Sign Up
      </button>
      {message && <p className="text-center mt-2">{message}</p>}
    </form>
  );
}
