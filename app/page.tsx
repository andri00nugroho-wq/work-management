import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import DashboardClient from "@/components/dashboard/dashboard-client";

// Membaca cookie = data dinamis, jadi harus di dalam <Suspense> (syarat cacheComponents).
async function DashboardGate() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <DashboardClient
      user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <DashboardGate />
    </Suspense>
  );
}