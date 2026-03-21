import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const UAZAPI_BASE_URL = Deno.env.get('UAZAPI_BASE_URL')
    const UAZAPI_ADMIN_TOKEN = Deno.env.get('UAZAPI_ADMIN_TOKEN')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!UAZAPI_BASE_URL || !UAZAPI_ADMIN_TOKEN) {
      return new Response(JSON.stringify({ success: false, message: 'UAZAPI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Auth: validate JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser()
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = claimsData.user.id

    // Service role client for DB operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Resolve tenant
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (tenantErr || !tenant) {
      return new Response(JSON.stringify({ success: false, message: 'Tenant not found' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tenantId = tenant.id
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const body = req.method === 'POST' || req.method === 'PUT' ? await req.json().catch(() => ({})) : {}

    // Helper: get or create instance record
    const getInstanceRecord = async () => {
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()
      return data
    }

    // ========== ACTIONS ==========

    if (action === 'create-instance') {
      // Check if already exists
      let instance = await getInstanceRecord()
      if (instance?.uazapi_instance_id) {
        return new Response(JSON.stringify({ success: true, data: { instance_id: instance.uazapi_instance_id, status: instance.status } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create instance on UAZAPI
      const createRes = await fetch(`${UAZAPI_BASE_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admintoken': UAZAPI_ADMIN_TOKEN },
        body: JSON.stringify({ instanceName: `tenant-${tenantId.slice(0, 8)}` }),
      })
      const createData = await createRes.json()

      if (!createRes.ok) {
        return new Response(JSON.stringify({ success: false, message: 'Failed to create UAZAPI instance', error: createData }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const instanceId = createData.instance || createData.instanceName || createData.name
      const token = createData.token || createData.apitoken

      // Upsert DB record
      await supabase.from('whatsapp_instances').upsert({
        tenant_id: tenantId,
        uazapi_instance_id: instanceId,
        uazapi_token: token,
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id' })

      return new Response(JSON.stringify({ success: true, data: { instance_id: instanceId, status: 'disconnected' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'connect' || action === 'qrcode') {
      const instance = await getInstanceRecord()
      if (!instance?.uazapi_instance_id || !instance?.uazapi_token) {
        return new Response(JSON.stringify({ success: false, message: 'No instance found. Create one first.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const stateRes = await fetch(`${UAZAPI_BASE_URL}/instance/connectionState/${instance.uazapi_instance_id}`, {
        headers: { 'token': instance.uazapi_token },
      })
      const stateData = await stateRes.json()

      const status = stateData.state || stateData.status || 'disconnected'
      const qrCode = stateData.qrcode || stateData.base64 || stateData.qr || null
      const phoneNumber = stateData.phoneNumber || stateData.phone || instance.phone_number

      // Update DB status
      await supabase.from('whatsapp_instances').update({
        status,
        phone_number: phoneNumber || null,
        updated_at: new Date().toISOString(),
      }).eq('tenant_id', tenantId)

      return new Response(JSON.stringify({
        success: true,
        data: { status, qrCode, phoneNumber, instance_id: instance.uazapi_instance_id },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'disconnect') {
      const instance = await getInstanceRecord()
      if (!instance?.uazapi_instance_id || !instance?.uazapi_token) {
        return new Response(JSON.stringify({ success: false, message: 'No instance found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await fetch(`${UAZAPI_BASE_URL}/instance/logout/${instance.uazapi_instance_id}`, {
        method: 'DELETE',
        headers: { 'token': instance.uazapi_token },
      })

      await supabase.from('whatsapp_instances').update({
        status: 'disconnected',
        phone_number: null,
        updated_at: new Date().toISOString(),
      }).eq('tenant_id', tenantId)

      return new Response(JSON.stringify({ success: true, data: { status: 'disconnected' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'send-text') {
      const instance = await getInstanceRecord()
      if (!instance?.uazapi_instance_id || !instance?.uazapi_token) {
        return new Response(JSON.stringify({ success: false, message: 'No instance connected' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { phone, message, messageType } = body
      if (!phone || !message) {
        return new Response(JSON.stringify({ success: false, message: 'phone and message required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const sendRes = await fetch(`${UAZAPI_BASE_URL}/send/text/${instance.uazapi_instance_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': instance.uazapi_token },
        body: JSON.stringify({ phone, message }),
      })
      const sendData = await sendRes.json()

      // Log message
      await supabase.from('whatsapp_message_log').insert({
        tenant_id: tenantId,
        recipient_phone: phone,
        message_type: messageType || 'manual',
        message_content: message,
        status: sendRes.ok ? 'sent' : 'failed',
        error_message: sendRes.ok ? null : JSON.stringify(sendData),
      })

      return new Response(JSON.stringify({ success: sendRes.ok, data: sendData }), {
        status: sendRes.ok ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get-alerts') {
      const { data: alerts } = await supabase
        .from('whatsapp_alert_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('alert_type')

      return new Response(JSON.stringify({ success: true, data: alerts || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'save-alerts') {
      const { alerts } = body
      if (!Array.isArray(alerts)) {
        return new Response(JSON.stringify({ success: false, message: 'alerts array required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      for (const alert of alerts) {
        await supabase.from('whatsapp_alert_configs').upsert({
          tenant_id: tenantId,
          alert_type: alert.alert_type,
          enabled: alert.enabled,
          template_message: alert.template_message,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id,alert_type' })
      }

      return new Response(JSON.stringify({ success: true, message: 'Alerts saved' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get-messages') {
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const { data: messages } = await supabase
        .from('whatsapp_message_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit)

      return new Response(JSON.stringify({ success: true, data: messages || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'set-webhook') {
      const instance = await getInstanceRecord()
      if (!instance?.uazapi_instance_id || !instance?.uazapi_token) {
        return new Response(JSON.stringify({ success: false, message: 'No instance found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const webhookUrl = body.webhookUrl
      const whRes = await fetch(`${UAZAPI_BASE_URL}/instance/setWebhook/${instance.uazapi_instance_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': instance.uazapi_token },
        body: JSON.stringify({ webhookUrl }),
      })
      const whData = await whRes.json()

      return new Response(JSON.stringify({ success: whRes.ok, data: whData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: false, message: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('whatsapp-proxy error:', error)
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
