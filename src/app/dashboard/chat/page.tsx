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
      className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90"
    >
      Logout
    </button>
  );
}
