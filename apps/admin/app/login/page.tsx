import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sha256Hex, SESSION_COOKIE } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    redirect("/login?error=1");
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, await sha256Hex(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect("/leads");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto mt-24 max-w-sm border border-rule bg-ink-raised p-8">
      <h1 className="text-xl font-bold">Admin GEO Sprint</h1>
      <form action={login} className="mt-4 space-y-3">
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          required
          className="field"
        />
        {error && <p className="text-sm text-signal">Mot de passe incorrect.</p>}
        <button className="btn-signal w-full">
          Entrer
        </button>
      </form>
    </div>
  );
}
