import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function checkEmailConfig() {
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!process.env.RESEND_API_KEY || !fromEmail) {
    throw new Error("Email configuration is incomplete.");
  }

  return fromEmail;
}

export async function sendShipmentStatusEmail({
  recipientEmail,
  recipientName,
  trackingNumber,
  status,
  description,
  location,
}: {
  recipientEmail: string;
  recipientName: string;
  trackingNumber: string;
  status: string;
  description: string;
  location: string;
}) {
  const fromEmail = checkEmailConfig();

  return resend.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: `Shipment Update: ${trackingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
        <h2>Shipment Status Update</h2>
        <p>Hello ${escapeHtml(recipientName)},</p>
        <p>Your shipment status has been updated.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
          <p><strong>Tracking Number:</strong> ${escapeHtml(trackingNumber)}</p>
          <p><strong>Current Status:</strong> ${escapeHtml(status.replaceAll("_", " "))}</p>
          <p><strong>Location:</strong> ${escapeHtml(location)}</p>
          <p><strong>Update:</strong> ${escapeHtml(description)}</p>
        </div>

        <p>You can check your shipment progress on our tracking page.</p>
        <p>FedEx Delivery</p>
      </div>
    `,
  });
}

export async function sendShipmentCreatedEmail({
  recipientEmail,
  recipientName,
  senderName,
  trackingNumber,
  serviceName,
  shippingPrice,
  estimatedDelivery,
}: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  trackingNumber: string;
  serviceName: string;
  shippingPrice: string;
  estimatedDelivery: Date;
}) {
  const fromEmail = checkEmailConfig();

  return resend.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: `Shipment Created: ${trackingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
        <h2>Shipment Confirmation</h2>

        <p>Hello ${escapeHtml(recipientName)},</p>

        <p>A shipment addressed to you has been successfully registered.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
          <p><strong>Tracking Number:</strong> ${escapeHtml(trackingNumber)}</p>
          <p><strong>Sender:</strong> ${escapeHtml(senderName)}</p>
          <p><strong>Shipping Service:</strong> ${escapeHtml(serviceName)}</p>
          <p><strong>Shipping Price:</strong> USD ${escapeHtml(shippingPrice)}</p>
          <p><strong>Current Status:</strong> PENDING</p>
          <p><strong>Estimated Delivery:</strong> ${escapeHtml(estimatedDelivery.toDateString())}</p>
        </div>

        <p>Keep your tracking number to check shipment progress on our tracking page.</p>

        <p>FedEx Delivery</p>
      </div>
    `,
  });
}
export async function sendSenderShipmentConfirmationEmail({
  senderEmail,
  senderName,
  recipientName,
  trackingNumber,
  serviceName,
  shippingPrice,
  estimatedDelivery,
}: {
  senderEmail: string;
  senderName: string;
  recipientName: string;
  trackingNumber: string;
  serviceName: string;
  shippingPrice: string;
  estimatedDelivery: Date;
}) {
  const fromEmail = checkEmailConfig();

  return resend.emails.send({
    from: fromEmail,
    to: senderEmail,
    subject: `Shipment Registered: ${trackingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
        <h2>Shipment Registration Confirmation</h2>

        <p>Hello ${escapeHtml(senderName)},</p>

        <p>Your shipment has been successfully registered.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
          <p><strong>Tracking Number:</strong> ${escapeHtml(trackingNumber)}</p>
          <p><strong>Recipient:</strong> ${escapeHtml(recipientName)}</p>
          <p><strong>Service:</strong> ${escapeHtml(serviceName)}</p>
          <p><strong>Shipping Price:</strong> USD ${escapeHtml(shippingPrice)}</p>
          <p><strong>Status:</strong> PENDING</p>
          <p><strong>Estimated Delivery:</strong> ${escapeHtml(estimatedDelivery.toDateString())}</p>
        </div>

        <p>Keep your tracking number to monitor shipment progress.</p>
        <p>FedEx Delivery</p>
      </div>
    `,
  });
}