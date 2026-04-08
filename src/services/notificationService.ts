import emailjs from '@emailjs/browser';

// These should be configured in your .env file
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_als_hamtic';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_status_update';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

export const sendStatusEmail = async (
  studentName: string,
  studentEmail: string,
  newStatus: string,
  reason?: string
) => {
  try {
    const templateParams = {
      to_name: studentName,
      to_email: studentEmail,
      status: newStatus.toUpperCase(),
      message: reason || (newStatus === 'approved' 
        ? 'Congratulations! Your enrollment has been approved. Please visit the center for your official schedule.' 
        : 'Your enrollment status has been updated. Please log in to your dashboard for details.'),
      reply_to: 'hamtic.als@deped.gov.ph'
    };

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Email sent successfully:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};


