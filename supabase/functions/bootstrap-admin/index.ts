/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BootstrapResponse =
  | { ok: true; email: string; password: string; userId: string }
  | { ok: false; error: string };

function json(body: BootstrapResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) {
      return json({ ok: false, error: "Server misconfiguration" }, 500);
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = (await req.json().catch(() => ({}))) as Partial<{
      email: string;
      password: string;
    }>;

    const email = (body.email ?? "demo.admin@arisehrm.test").trim().toLowerCase();
    const password = body.password ?? "Demo@12345";

    // 1) Create auth user (or fetch if exists)
    let userId: string | null = null;

    const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw listErr;

    const existing = listData.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (existing?.id) {
      userId = existing.id;
      // Ensure the password is what we return (so the user can log in)
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (updErr) throw updErr;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      userId = created.user?.id ?? null;
    }

    if (!userId) return json({ ok: false, error: "Failed to create user" }, 500);

    // 2) Ensure profile exists
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email }, { onConflict: "id" });
    if (profileErr) throw profileErr;

    // 3) Assign super_admin role (idempotent)
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw roleErr;

    return json({ ok: true, email, password, userId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg }, 500);
  }
});
