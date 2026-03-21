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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const UAZAPI_BASE_URL = Deno.env.get('UAZAPI_BASE_URL')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const body = await req.json().catch(() => ({}))

    // Action: process-traccar-event
    // Called by traccar-proxy or external webhook when a Traccar event occurs
    if (action === 'process-event') {
      const { tenantId, eventType, deviceName, eventTime, phone, extraData } = body

      if (!tenantId || !eventType || !phone) {
        return new Response(JSON.stringify({ success: false, message: 'tenantId, eventType, phone required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check if alert is enabled for this tenant + type
      const { data: alertConfig } = await supabase
        .from('whatsapp_alert_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('alert_type', eventType)
        .eq('enabled', true)
        .single()

      if (!alertConfig) {
        return new Response(JSON.stringify({ success: true, message: 'Alert not enabled for this type', sent: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get WhatsApp instance
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'connected')
        .single()

      if (!instance || !UAZAPI_BASE_URL) {
        return new Response(JSON.stringify({ success: false, message: 'No connected WhatsApp instance', sent: false }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Build message from template
      let message = alertConfig.template_message || `Alerta: ${eventType}`
      message = message
        .replace(/{device}/g, deviceName || 'Desconhecido')
        .replace(/{event}/g, eventType)
        .replace(/{time}/g, eventTime || new Date().toLocaleString('pt-BR'))
        .replace(/{data}/g, extraData || '')

      // Send via UAZAPI
      const sendRes = await fetch(`${UAZAPI_BASE_URL}/send/text/${instance.uazapi_instance_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': instance.uazapi_token },
        body: JSON.stringify({ phone, message }),
      })
      const sendData = await sendRes.json()

      // Log
      await supabase.from('whatsapp_message_log').insert({
        tenant_id: tenantId,
        recipient_phone: phone,
        message_type: 'alert',
        message_content: message,
        status: sendRes.ok ? 'sent' : 'failed',
        error_message: sendRes.ok ? null : JSON.stringify(sendData),
      })

      return new Response(JSON.stringify({ success: sendRes.ok, sent: sendRes.ok, data: sendData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Action: uazapi-delivery (webhook from UAZAPI for delivery receipts)
    if (action === 'delivery-receipt') {
      // UAZAPI sends delivery status updates
      const { messageId, status: deliveryStatus } = body
      console.log('Delivery receipt:', { messageId, deliveryStatus })

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: false, message: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('whatsapp-webhook error:', error)
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
