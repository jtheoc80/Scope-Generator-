// Email service using Resend integration
import { Resend } from 'resend';
import { db } from '@/server/db';
import { emailOutbox, type EmailOutboxAttachment } from '@shared/schema';

// Cache the Resend client
let resendClient: Resend | null = null;

/**
 * Get email credentials from environment variables.
 * Required env vars:
 *   - RESEND_API_KEY: Your Resend API key
 *   - FROM_EMAIL: The email address to send from (e.g., proposals@scopegenerator.com)
 */
function getFromEmail(): string {
  return process.env.FROM_EMAIL || 'onboarding@resend.dev';
}

function getCredentials(): { apiKey: string; fromEmail: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = getFromEmail();

  if (!apiKey) {
    console.error('[EmailService] RESEND_API_KEY environment variable is not set');
    throw new Error('Email service not configured');
  }

  return { apiKey, fromEmail };
}

function getResendClient(): { client: Resend; fromEmail: string } {
  const { apiKey, fromEmail } = getCredentials();
  
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  
  return { client: resendClient, fromEmail };
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    content: Buffer | Uint8Array | ArrayBuffer | string;
  }>;
  /**
   * Optional metadata to help deterministic testing (EMAIL_MODE=test).
   */
  proposalId?: number;
  runId?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const mode = process.env.EMAIL_MODE === 'test' ? 'test' : 'prod';

    // Deterministic test/dev mode: write emails to DB outbox (no external provider dependency).
    if (mode === 'test') {
      const attachments: EmailOutboxAttachment[] = (options.attachments || []).map((a) => {
        let buf: Buffer;
        if (typeof a.content === 'string') {
          // Treat as raw string payload; store base64 of UTF-8 to preserve bytes deterministically.
          buf = Buffer.from(a.content, 'utf8');
        } else if (a.content instanceof ArrayBuffer) {
          buf = Buffer.from(new Uint8Array(a.content));
        } else {
          buf = Buffer.from(a.content as Buffer | Uint8Array);
        }
        return {
          filename: a.filename,
          contentType: a.contentType,
          contentBase64: buf.toString('base64'),
          byteLength: buf.byteLength,
        };
      });

      const [row] = await db
        .insert(emailOutbox)
        .values({
          mode: 'test',
          to: options.to,
          from: options.from || null,
          subject: options.subject,
          textBody: options.text,
          htmlBody: options.html || null,
          proposalId: options.proposalId ?? null,
          runId: options.runId ?? null,
          attachments,
        })
        .returning();

      return { success: true, messageId: `outbox:${row.id}` };
    }

    const { client, fromEmail } = getResendClient();
    const emailAddress = fromEmail;
    const defaultFrom = `ScopeGen <${emailAddress}>`;
    
    const result = await client.emails.send({
      from: options.from || defaultFrom,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === 'string' ? a.content : Buffer.from(a.content as any),
      })),
    });

    if (result.error) {
      console.error('[EmailService] Resend API error:', {
        code: result.error.name,
        message: result.error.message,
        to: options.to,
      });
      return { success: false, error: 'Failed to send email' };
    }

    console.log('[EmailService] Email sent successfully:', {
      messageId: result.data?.id,
      to: options.to,
      subject: options.subject,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('[EmailService] Email sending failed:', {
      error: error.message,
      stack: error.stack,
      to: options.to,
    });
    return { success: false, error: 'Failed to send email' };
  }
}

export async function testConnection(): Promise<{ success: boolean; fromEmail?: string; error?: string }> {
  try {
    if (process.env.EMAIL_MODE === 'test') {
      return { success: true, fromEmail: getFromEmail() };
    }

    const { fromEmail } = getCredentials();
    console.log('[EmailService] Connection test successful, fromEmail:', fromEmail);
    return { 
      success: true, 
      fromEmail 
    };
  } catch (error: any) {
    console.error('[EmailService] Connection test failed:', error.message);
    return { success: false, error: 'Email service not configured' };
  }
}

interface ProposalEmailData {
  recipientEmail: string;
  recipientName?: string;
  proposalTitle: string;
  clientName: string;
  totalPrice: number;
  senderName?: string;
  senderCompany?: string;
  customMessage?: string;
  proposalUrl?: string;
  proposalId?: number;
  attachments?: EmailOptions['attachments'];
  runId?: string;
}

export async function sendProposalEmail(data: ProposalEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
  
  const formattedPrice = formatCurrency(data.totalPrice);

  const subject = `Proposal: ${data.proposalTitle} for ${data.clientName}`;
  
  const text = `
Hi ${data.recipientName || 'there'},

${data.senderCompany || data.senderName || 'We'} have prepared a proposal for you.

Project: ${data.proposalTitle}
Total: ${formattedPrice}

${data.customMessage ? `\nMessage from ${data.senderName || 'the contractor'}:\n${data.customMessage}\n` : ''}

Best regards,
${data.senderName || 'The Team'}
${data.senderCompany || ''}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #1e3a5f; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; background: #f9f9f9; }
    .project-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .amount { font-size: 32px; color: #1e3a5f; font-weight: bold; margin: 15px 0; }
    .label { color: #666; font-size: 14px; margin-bottom: 5px; }
    .value { font-size: 18px; color: #333; font-weight: 500; }
    .message { background: white; padding: 20px; border-left: 4px solid #f97316; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .button { display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 12px; background: #e5e5e5; }
    .footer a { color: #1e3a5f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Proposal</h1>
    </div>
    <div class="content">
      <p>Hi ${data.recipientName || 'there'},</p>
      <p><strong>${data.senderCompany || data.senderName || 'We'}</strong> have prepared a proposal for your project.</p>
      
      <div class="project-card">
        <div class="label">PROJECT</div>
        <div class="value" style="font-size: 22px; margin-bottom: 15px;">${data.proposalTitle}</div>
        
        <div class="label">CLIENT</div>
        <div class="value" style="margin-bottom: 15px;">${data.clientName}</div>
        
        <div class="label">TOTAL</div>
        <div class="amount">${formattedPrice}</div>
      </div>
      
      ${data.customMessage ? `
      <div class="message">
        <p style="margin: 0;"><strong>Message from ${data.senderName || 'the contractor'}:</strong></p>
        <p style="margin: 10px 0 0 0;">${data.customMessage}</p>
      </div>
      ` : ''}
      
      ${data.proposalUrl ? `
      <div style="text-align: center; margin-top: 30px;">
        <a href="${data.proposalUrl}" class="button" style="display: inline-block; background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View & Download Proposal
        </a>
        <p style="margin-top: 15px; font-size: 12px; color: #666;">
          Click the button above to view the full proposal and download it as a PDF.
        </p>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>This proposal was created with <a href="#">ScopeGen</a></p>
      <p>Professional proposals for contractors</p>
    </div>
  </div>
</body>
</html>
`.trim();

  try {
    const emailAddress = process.env.EMAIL_MODE === 'test' ? getFromEmail() : getCredentials().fromEmail;
    const fromAddress = data.senderName 
      ? `${data.senderName} via ScopeGen <${emailAddress}>` 
      : `ScopeGen <${emailAddress}>`;
      
    console.log('[EmailService] Sending proposal email:', {
      to: data.recipientEmail,
      project: data.proposalTitle,
      client: data.clientName,
    });
      
    return sendEmail({
      to: data.recipientEmail,
      subject,
      text,
      html,
      from: fromAddress,
      attachments: data.attachments,
      proposalId: data.proposalId,
      runId: data.runId,
    });
  } catch (error: any) {
    console.error('[EmailService] Failed to send proposal email:', error.message);
    return { success: false, error: 'Failed to send email' };
  }
}

interface PurchaseNotificationData {
  customerEmail: string;
  customerName?: string;
  planName: string;
  amount: number;
  subscriptionId: string;
}

export async function sendPurchaseNotification(
  adminEmail: string,
  data: PurchaseNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(amount / 100);

  const formattedAmount = formatCurrency(data.amount);
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const subject = `New Pro Subscription: ${data.customerEmail}`;

  const text = `
New Pro Subscription Purchase!

Customer: ${data.customerName || data.customerEmail}
Email: ${data.customerEmail}
Plan: ${data.planName}
Amount: ${formattedAmount}
Subscription ID: ${data.subscriptionId}
Time: ${timestamp}

View in Stripe Dashboard: https://dashboard.stripe.com/subscriptions/${data.subscriptionId}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 500px; margin: 20px auto; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 25px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .emoji { font-size: 40px; margin-bottom: 10px; }
    .content { padding: 25px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 14px; }
    .value { font-weight: 600; color: #333; }
    .amount { font-size: 28px; color: #22c55e; text-align: center; margin: 20px 0; }
    .button { display: block; background: #1e3a5f; color: white; padding: 14px; text-align: center; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; padding: 15px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="emoji">🎉</div>
        <h1>New Pro Subscription!</h1>
      </div>
      <div class="content">
        <div class="amount">${formattedAmount}</div>
        
        <div class="row">
          <span class="label">Customer</span>
          <span class="value">${data.customerName || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Email</span>
          <span class="value">${data.customerEmail}</span>
        </div>
        <div class="row">
          <span class="label">Plan</span>
          <span class="value">${data.planName}</span>
        </div>
        <div class="row">
          <span class="label">Time</span>
          <span class="value">${timestamp}</span>
        </div>
        
        <a href="https://dashboard.stripe.com/subscriptions/${data.subscriptionId}" class="button">
          View in Stripe Dashboard →
        </a>
      </div>
    </div>
    <div class="footer">
      ScopeGen Purchase Notification
    </div>
  </div>
</body>
</html>
`.trim();

  return sendEmail({
    to: adminEmail,
    subject,
    text,
    html,
  });
}

interface ProposalAcceptedNotificationData {
  contractorEmail: string;
  contractorName?: string;
  clientName: string;
  clientEmail: string;
  acceptedByName: string;
  projectTitle: string;
  projectAddress?: string;
  totalPrice: number;
  acceptedAt: Date;
}

export async function sendProposalAcceptedNotification(
  data: ProposalAcceptedNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);

  const formattedPrice = formatCurrency(data.totalPrice);
  const timestamp = new Date(data.acceptedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const subject = `Proposal Accepted: ${data.projectTitle} - ${data.clientName}`;

  const text = `
Great news! Your proposal has been accepted!

Client: ${data.clientName}
Accepted By: ${data.acceptedByName}
Email: ${data.clientEmail}
Project: ${data.projectTitle}
${data.projectAddress ? `Address: ${data.projectAddress}` : ''}
Amount: ${formattedPrice}
Accepted: ${timestamp}

Time to get to work! You can reach out to ${data.acceptedByName} at ${data.clientEmail} to coordinate next steps.
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 500px; margin: 20px auto; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 25px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .emoji { font-size: 40px; margin-bottom: 10px; }
    .content { padding: 25px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 14px; }
    .value { font-weight: 600; color: #333; text-align: right; }
    .amount { font-size: 28px; color: #22c55e; text-align: center; margin: 20px 0; }
    .cta { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin-top: 20px; text-align: center; }
    .cta p { margin: 5px 0; }
    .cta a { color: #16a34a; font-weight: 600; }
    .footer { text-align: center; padding: 15px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="emoji">✅</div>
        <h1>Proposal Accepted!</h1>
      </div>
      <div class="content">
        <p>Hi${data.contractorName ? ` ${data.contractorName}` : ''},</p>
        <p>Great news! Your proposal has been accepted and you're ready to start the project.</p>
        
        <div class="amount">${formattedPrice}</div>
        
        <div class="row">
          <span class="label">Client</span>
          <span class="value">${data.clientName}</span>
        </div>
        <div class="row">
          <span class="label">Accepted By</span>
          <span class="value">${data.acceptedByName}</span>
        </div>
        <div class="row">
          <span class="label">Contact Email</span>
          <span class="value">${data.clientEmail}</span>
        </div>
        <div class="row">
          <span class="label">Project</span>
          <span class="value">${data.projectTitle}</span>
        </div>
        ${data.projectAddress ? `
        <div class="row">
          <span class="label">Address</span>
          <span class="value">${data.projectAddress}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">Accepted</span>
          <span class="value">${timestamp}</span>
        </div>
        
        <div class="cta">
          <p><strong>Next Steps</strong></p>
          <p>Reach out to ${data.acceptedByName} at <a href="mailto:${data.clientEmail}">${data.clientEmail}</a> to coordinate the project.</p>
        </div>
      </div>
    </div>
    <div class="footer">
      ScopeGen Proposal Notification
    </div>
  </div>
</body>
</html>
`.trim();

  return sendEmail({
    to: data.contractorEmail,
    subject,
    text,
    html,
  });
}

interface CompletedProposalEmailData {
  clientEmail: string;
  clientName: string;
  contractorName?: string;
  contractorCompany?: string;
  projectTitle: string;
  projectAddress?: string;
  totalPrice: number;
  acceptedAt: Date;
  contractorSignedAt: Date;
  proposalUrl?: string;
}

export async function sendCompletedProposalToClient(
  data: CompletedProposalEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);

  const formattedPrice = formatCurrency(data.totalPrice);
  const acceptedDate = new Date(data.acceptedAt).toLocaleDateString('en-US', {
    dateStyle: 'long'
  });
  const signedDate = new Date(data.contractorSignedAt).toLocaleDateString('en-US', {
    dateStyle: 'long'
  });

  const subject = `Signed Proposal: ${data.projectTitle} - Ready to Begin`;

  const text = `
Hi ${data.clientName},

Great news! Your proposal has been fully signed and the project is ready to begin.

Project: ${data.projectTitle}
${data.projectAddress ? `Address: ${data.projectAddress}` : ''}
Total: ${formattedPrice}

You signed: ${acceptedDate}
Contractor signed: ${signedDate}

${data.proposalUrl ? `View your signed proposal: ${data.proposalUrl}` : ''}

${data.contractorCompany || data.contractorName || 'Your contractor'} will be in touch soon to coordinate next steps.

Thank you for your business!

Best regards,
${data.contractorCompany || data.contractorName || 'Your Contractor'}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 500px; margin: 20px auto; }
    .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f, #2d4a6f); color: white; padding: 25px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header .emoji { font-size: 40px; margin-bottom: 10px; }
    .content { padding: 25px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 14px; }
    .value { font-weight: 600; color: #333; text-align: right; }
    .amount { font-size: 28px; color: #1e3a5f; text-align: center; margin: 20px 0; }
    .signed-badge { display: flex; align-items: center; justify-content: center; gap: 8px; background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 12px; margin: 15px 0; color: #16a34a; font-weight: 600; }
    .button { display: block; background: #f97316; color: white; padding: 14px; text-align: center; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; padding: 15px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="emoji">📝✅</div>
        <h1>Proposal Fully Signed!</h1>
      </div>
      <div class="content">
        <p>Hi ${data.clientName},</p>
        <p>Great news! Your proposal has been fully signed by both parties and the project is ready to begin.</p>
        
        <div class="signed-badge">
          <span>✓</span> Both signatures complete
        </div>
        
        <div class="amount">${formattedPrice}</div>
        
        <div class="row">
          <span class="label">Project</span>
          <span class="value">${data.projectTitle}</span>
        </div>
        ${data.projectAddress ? `
        <div class="row">
          <span class="label">Address</span>
          <span class="value">${data.projectAddress}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">You signed</span>
          <span class="value">${acceptedDate}</span>
        </div>
        <div class="row">
          <span class="label">Contractor signed</span>
          <span class="value">${signedDate}</span>
        </div>
        
        ${data.proposalUrl ? `
        <a href="${data.proposalUrl}" class="button">
          View Signed Proposal
        </a>
        ` : ''}
        
        <p style="margin-top: 25px; font-size: 14px; color: #666;">
          ${data.contractorCompany || data.contractorName || 'Your contractor'} will be in touch soon to coordinate next steps.
        </p>
      </div>
    </div>
    <div class="footer">
      ScopeGen - Professional Proposals for Contractors
    </div>
  </div>
</body>
</html>
`.trim();

  try {
    const emailAddress = process.env.EMAIL_MODE === 'test' ? getFromEmail() : getCredentials().fromEmail;
    const fromAddress = data.contractorName 
      ? `${data.contractorName} via ScopeGen <${emailAddress}>` 
      : `ScopeGen <${emailAddress}>`;
    
    console.log('[EmailService] Sending completed proposal email:', {
      to: data.clientEmail,
      project: data.projectTitle,
      client: data.clientName,
    });
      
    return sendEmail({
      to: data.clientEmail,
      subject,
      text,
      html,
      from: fromAddress
    });
  } catch (error: any) {
    console.error('[EmailService] Failed to send completed proposal email:', error.message);
    return { success: false, error: 'Failed to send email' };
  }
}

export const emailService = {
  sendEmail,
  sendProposalEmail,
  sendPurchaseNotification,
  sendProposalAcceptedNotification,
  sendCompletedProposalToClient,
  testConnection,
};
