import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, name, resetLink, type } = await req.json()

    // Email content
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Reset - Feza Programming Club</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #002B5C; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #002B5C; margin: 0;">Feza Programming Club</h1>
            <p style="color: #FDB913; font-size: 18px; margin: 5px 0 0;">Password Reset Request</p>
          </div>
          
          <div style="padding: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password for your Feza Programming Club account.</p>
            
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <a href="${resetLink}" style="display: inline-block; background-color: #002B5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Your Password</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${resetLink}</p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">This link will expire in 24 hours.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>Feza Programming Club | Empowering young coders</p>
            <p>© ${new Date().getFullYear()} Feza Programming Club. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Use Resend API to send email (free tier)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Feza Programming Club <noreply@fezaclub.com>',
        to: [to],
        subject: 'Reset Your Password - Feza Programming Club',
        html: emailContent,
      }),
    })

    const result = await emailResponse.json()

    if (!emailResponse.ok) {
      throw new Error(result.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
