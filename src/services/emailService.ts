import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_APPROVED = import.meta.env.VITE_EMAILJS_TEMPLATE_APPROVED || '';
const TEMPLATE_REJECTED = import.meta.env.VITE_EMAILJS_TEMPLATE_REJECTED || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

export const sendApprovalEmail = async (
  toName: string,
  toEmail: string,
  customMessage?: string
) => {
  if (!SERVICE_ID || !TEMPLATE_APPROVED || !PUBLIC_KEY) {
    console.warn('EmailJS not configured. Skipping email send.');
    return { success: false, error: 'EmailJS not configured' };
  }
  try {
    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_APPROVED,
      {
        to_name: toName,
        to_email: toEmail,
        school_name: 'Hamtic ALS Program',
        custom_message: customMessage || '',
      },
      { publicKey: PUBLIC_KEY }
    );
    return { success: true, result };
  } catch (err: any) {
    console.error('EmailJS approval send error:', err);
    return { success: false, error: err?.text || err?.message || 'Failed to send email' };
  }
};

export const sendRejectionEmail = async (
  toName: string,
  toEmail: string,
  reason: string,
  customMessage?: string
) => {
  if (!SERVICE_ID || !TEMPLATE_REJECTED || !PUBLIC_KEY) {
    console.warn('EmailJS not configured. Skipping email send.');
    return { success: false, error: 'EmailJS not configured' };
  }
  try {
    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_REJECTED,
      {
        to_name: toName,
        to_email: toEmail,
        school_name: 'Hamtic ALS Program',
        rejection_reason: reason,
        custom_message: customMessage || '',
      },
      { publicKey: PUBLIC_KEY }
    );
    return { success: true, result };
  } catch (err: any) {
    console.error('EmailJS rejection send error:', err);
    return { success: false, error: err?.text || err?.message || 'Failed to send email' };
  }
};
