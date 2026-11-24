import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import RequestForm from "./request-form";

export const metadata = { title: "Formulir Permintaan · REI Work Management" };

// Parameter rute = data runtime: akses harus di dalam <Suspense> (syarat cacheComponents).
export default function RequestPage({ params }: PageProps<"/request/[slug]">) {
  return (
    <Suspense fallback={<main className="request-shell">Memuat formulir...</main>}>
      {params.then(({ slug }) => (
        <RequestGate slug={slug} />
      ))}
    </Suspense>
  );
}

async function RequestGate({ slug }: { slug: string }) {
  const form = await prisma.intakeForm.findFirst({
    where: { slug, isActive: true },
    select: { name: true, description: true, isPublic: true },
  });
  if (!form) notFound();
  const user = await getCurrentUser();
  if (!form.isPublic && !user) redirect("/login");
  return (
    <RequestForm
      slug={slug}
      name={form.name}
      description={form.description}
      user={user ? { name: user.name, email: user.email } : null}
    />
  );
}
