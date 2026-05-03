import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { montant, mois, telephone, type } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Simulation d'URL spécifique au mode
    let payment_url = '';
    if (type === 'WAVE') {
      payment_url = `https://wave.sandbox.test/pay?amount=${montant}&ref=ASC-${Date.now()}`;
    } else {
      payment_url = `https://orange-money.sandbox.test/checkout?amount=${montant}&ref=ASC-${Date.now()}`;
    }

    // Insertion avec le type de méthode
    const { error: insertError } = await supabase
      .from('transactions')
      .insert([
        { 
          montant, 
          mois, 
          telephone, 
          statut: 'en_attente',
          payment_url,
          type_methode: type // On suppose que cette colonne existe ou sera ajoutée
        }
      ])

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ payment_url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
