import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/dashboard-client";

// Membaca cookie = data dinamis, jadi harus di dalam <Suspense> (syarat cacheComponents).
async function DashboardGate() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const hasSessionCookie = Boolean(cookieStore.get("token")?.value);
  const hasApiKey = (requestHeaders.get("authorization") ?? "").startsWith("Bearer rei_");

  // Lewati pemuatan modul auth/database untuk pengunjung biasa tanpa sesi.
  if (!hasSessionCookie && !hasApiKey) redirect("/login");

  const { getCurrentUser } = await import("@/lib/current-user");
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
