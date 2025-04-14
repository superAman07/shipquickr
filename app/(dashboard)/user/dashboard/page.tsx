"use client";

import LogoutButton from "@/components/logout";

export default function Dashboard() {
  return (
    <div className="p-6 w-full h-full bg-[#252525]">
      <h1 className="text-2xl font-semibold">Welcome to your Dashboard!</h1>
      <LogoutButton />
    </div>
  );
}