import { supabase } from './supabase';

// Function to generate password setup link
export const generatePasswordSetupLink = async (email) => {
  try {
    const { data: token, error: tokenError } = await supabase
      .rpc('generate_password_reset_token', { user_email: email });

    if (tokenError) throw tokenError;
    
    const setupLink = `${window.location.origin}/student/setup-password?token=${token}`;
    return setupLink;
  } catch (error) {
    console.error('Error generating link:', error);
    return null;
  }
};

// Function to send email using Resend or EmailJS
// For now, we'll use EmailJS (free tier) - you'll need to sign up at emailjs.com
export const sendPasswordSetupEmail = async (email, name, setupLink) => {
  try {
    // Using EmailJS (free tier)
    // Sign up at https://www.emailjs.com/ and create an email template
    const emailjs = await import('@emailjs/browser');
    
    const templateParams = {
      to_email: email,
      to_name: name,
      setup_link: setupLink,
      club_name: 'Feza Programming Club',
      expiry_hours: '24'
    };
    
    // Replace with your EmailJS credentials
    await emailjs.send(
      'YOUR_SERVICE_ID',     // Get from EmailJS
      'YOUR_TEMPLATE_ID',    // Get from EmailJS
      templateParams,
      'YOUR_PUBLIC_KEY'      // Get from EmailJS
    );
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Alternative: Using Supabase Edge Functions (more advanced)
export const sendEmailViaEdgeFunction = async (email, name, setupLink) => {
  try {
    const response = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        name: name,
        setupLink: setupLink,
        type: 'password_setup'
      }
    });
    
    return response.data?.success || false;
  } catch (error) {
    console.error('Error calling edge function:', error);
    return false;
  }
};

// Simple: Open email client with pre-filled message
export const openEmailClient = (email, name, setupLink) => {
  const subject = encodeURIComponent('Welcome to Feza Programming Club - Set Up Your Password');
  const body = encodeURIComponent(`
Hello ${name},

Congratulations! Your membership request for Feza Programming Club has been approved.

Click the link below to set up your password and activate your account:

${setupLink}

This link will expire in 24 hours.

Once you set up your password, you can log in at:
${window.location.origin}/student/login

Happy coding! 🚀

Best regards,
Feza Programming Club Team
  `);
  
  window.open(`mailto:${email}?subject=${subject}&body=${body}`);
};
