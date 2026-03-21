import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 30);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { company_name, traccar_url, owner_email, password, color_primary, color_secondary } = body;

    if (!company_name || !owner_email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Campos obrigatórios: company_name, owner_email, password",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner_email)) {
      return new Response(
        JSON.stringify({ success: false, message: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanUrl = traccar_url ? traccar_url.replace(/\/$/, "") : "https://pending-setup.example.com";

    // Check existing tenant by email
    const { data: existing } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("owner_email", owner_email)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "Já existe uma conta com este email" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: owner_email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, message: authError?.message || "Erro ao criar usuário" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate slug
    let slug = generateSlug(company_name);
    const { data: slugCheck } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .single();
    if (slugCheck) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        company_name,
        traccar_url: cleanUrl,
        owner_email,
        slug,
        user_id: authData.user.id,
        color_primary: color_primary || "#1a73e8",
        color_secondary: color_secondary || "#ffffff",
        subscription_status: "trial",
        plan_type: "basic",
        trial_ends_at: trialEndsAt,
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Tenant creation error:", tenantError);
      // Cleanup: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ success: false, message: "Erro ao criar conta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conta criada com sucesso!",
        data: {
          slug: tenant.slug,
          company_name: tenant.company_name,
          trial_ends_at: tenant.trial_ends_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create tenant error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
