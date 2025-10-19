"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/login"); // Redirect to login
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-foreground hover:text-foreground/80 rounded-md"
    >
      Logout
    </button>
  );
}
