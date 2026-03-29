import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-tenant-slug, x-traccar-email, x-traccar-password",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getTenant(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) throw new Error(`Tenant not found: ${slug}`);
  return data;
}

async function getStoredSession(tenantId: string, email: string) {
  const { data } = await supabaseAdmin
    .from("traccar_sessions")
    .select("session_cookie, expires_at")
    .eq("tenant_id", tenantId)
    .eq("user_email", email)
    .single();

  if (data?.session_cookie) {
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabaseAdmin
        .from("traccar_sessions")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("user_email", email);
      return null;
    }
    return data.session_cookie;
  }
  return null;
}

async function storeSession(
  tenantId: string,
  email: string,
  cookie: string,
  traccarUserId?: number
) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from("traccar_sessions").upsert(
    {
      tenant_id: tenantId,
      user_email: email,
      session_cookie: cookie,
      traccar_user_id: traccarUserId ?? null,
      expires_at: expiresAt,
    },
    { onConflict: "tenant_id,user_email" }
  );
}

async function deleteSession(tenantId: string, email: string) {
  await supabaseAdmin
    .from("traccar_sessions")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_email", email);
}

function extractJSessionId(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/JSESSIONID=([^;]+)/);
  return match ? match[1] : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path");
    if (!path) {
      return new Response(JSON.stringify({ error: "Missing path parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantSlug = req.headers.get("x-tenant-slug");
    if (!tenantSlug) {
      return new Response(
        JSON.stringify({ error: "Missing x-tenant-slug header" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tenant = await getTenant(tenantSlug);

    // Check subscription
    if (
      tenant.subscription_status === "suspended" ||
      tenant.subscription_status === "cancelled"
    ) {
      return new Response(
        JSON.stringify({ error: "Tenant subscription inactive" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const traccarUrl = tenant.traccar_url.replace(/\/$/, "");
    const email = req.headers.get("x-traccar-email") || "";

    // Build headers for Traccar request
    const traccarHeaders: Record<string, string> = {};

    // For login (POST /api/session), forward the body directly
    if (path === "/api/session" && req.method === "POST") {
      const body = await req.text();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        console.log(`[Proxy] Login attempt for tenant ${tenantSlug}, email ${email}`);
        const traccarResponse = await fetch(`${traccarUrl}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
          redirect: "follow",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const setCookie = traccarResponse.headers.get("set-cookie");
        const jsessionId = extractJSessionId(setCookie);
        const responseBody = await traccarResponse.text();

        if (traccarResponse.ok && jsessionId && email) {
          try {
            const user = JSON.parse(responseBody);
            await storeSession(tenant.id, email, jsessionId, user.id);
          } catch {
            await storeSession(tenant.id, email, jsessionId);
          }
        }

        return new Response(responseBody, {
          status: traccarResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            ...(jsessionId
              ? { "x-traccar-session": jsessionId }
              : {}),
          },
        });
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error(`[Proxy] Login timeout for tenant ${tenantSlug}`);
          return new Response(
            JSON.stringify({ error: "Login timed out. Please check if the tracking server is responsive." }),
            {
              status: 504,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        throw error;
      }
    }

    // For logout (DELETE /api/session)
    if (path === "/api/session" && req.method === "DELETE") {
      const sessionCookie = email
        ? await getStoredSession(tenant.id, email)
        : null;
      
      if (sessionCookie) {
        await fetch(`${traccarUrl}${path}`, {
          method: "DELETE",
          headers: { Cookie: `JSESSIONID=${sessionCookie}` },
        });
        await deleteSession(tenant.id, email);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For all other requests, use stored session
    const sessionCookie = email
      ? await getStoredSession(tenant.id, email)
      : null;

    if (sessionCookie) {
      traccarHeaders["Cookie"] = `JSESSIONID=${sessionCookie}`;
    }

    // Forward query params from the original path
    const targetUrl = new URL(`${traccarUrl}${path}`);
    // Copy any additional query params (besides 'path') to the target
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "path") {
        targetUrl.searchParams.set(key, value);
      }
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: traccarHeaders,
      redirect: "follow",
    };

    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const contentType = req.headers.get("content-type");
      if (contentType) {
        traccarHeaders["Content-Type"] = contentType;
      }
      fetchOptions.body = await req.text();
    }

    // Add timeout to prevent hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    fetchOptions.signal = controller.signal;

    try {
      console.log(`[Proxy] Fetching ${targetUrl.toString()} for tenant ${tenantSlug}`);
      const traccarResponse = await fetch(targetUrl.toString(), fetchOptions);
      clearTimeout(timeoutId);

      // If 401, the stored session expired — clean it up
      if (traccarResponse.status === 401 && email) {
        await deleteSession(tenant.id, email);
      }

      // Null-body statuses (204, 304) cannot have a body
      const nullBodyStatuses = [204, 304];
      if (nullBodyStatuses.includes(traccarResponse.status)) {
        return new Response(null, {
          status: traccarResponse.status,
          headers: corsHeaders,
        });
      }

      const responseBody = await traccarResponse.arrayBuffer();

      return new Response(responseBody, {
        status: traccarResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type":
            traccarResponse.headers.get("Content-Type") || "application/json",
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`[Proxy] Timeout fetching ${targetUrl.toString()}`);
        return new Response(
          JSON.stringify({ error: "Tracking server connection timed out. Please check if the server is responsive." }),
          {
            status: 504,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Traccar proxy error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal proxy error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
