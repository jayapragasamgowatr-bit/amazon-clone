const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Get the sender address.
 *
 * For testing:
 * RESEND_FROM_EMAIL=Waventra Vetric <onboarding@resend.dev>
 *
 * For production, use an email address from your verified domain.
 */
const getFromEmail = () => {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "Waventra Vetric <onboarding@resend.dev>"
  );
};

/**
 * Escape HTML values before inserting them into email templates.
 */
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/**
 * Format Indian Rupee amounts.
 */
const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

/**
 * Verify that the Resend service is configured.
 *
 * Unlike SMTP, this does not open a persistent SMTP connection.
 */
const verifyEmailConnection = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return false;
  }

  try {
    console.log("Resend email service configured successfully");
    return true;
  } catch (error) {
    console.error(
      "Resend email verification failed:",
      error.message
    );

    return false;
  }
};

/**
 * Generic email sender.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Resend email service is not configured");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend email failed:", error);

      throw new Error(
        error.message || "Failed to send email"
      );
    }

    console.log(
      `Email sent successfully: ${data?.id || "unknown"}`
    );

    return data;
  } catch (error) {
    console.error(
      "Email sending error:",
      error.message
    );

    throw error;
  }
};

/**
 * Render order items as an HTML table.
 */
const renderItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);

      return `
        <tr>
          <td style="
            padding:12px;
            border-bottom:1px solid #ddd;
          ">
            ${escapeHtml(item.name || "Product")}
          </td>

          <td style="
            padding:12px;
            border-bottom:1px solid #ddd;
            text-align:center;
          ">
            ${quantity}
          </td>

          <td style="
            padding:12px;
            border-bottom:1px solid #ddd;
            text-align:right;
          ">
            ${formatINR(quantity * price)}
          </td>
        </tr>
      `;
    })
    .join("");

/**
 * Render shipping address.
 */
const addressHtml = (order) => {
  const address = order.shippingAddress || {};

  return `
    ${escapeHtml(address.address || "")}<br/>
    ${escapeHtml(address.city || "")}<br/>
    ${escapeHtml(address.state || "")}<br/>
    Pincode:
    ${escapeHtml(
      address.postalCode ||
        address.pincode ||
        ""
    )}
  `;
};

/**
 * Customer order confirmation email.
 */
const sendOrderConfirmationEmail = async (order) => {
  const customerEmail = String(
    order.customer?.email || ""
  )
    .trim()
    .toLowerCase();

  if (!customerEmail) {
    throw new Error(
      "Customer email is missing from order"
    );
  }

  const customerName = escapeHtml(
    order.customer?.name || "Customer"
  );

  const orderId = escapeHtml(order._id);

  const phone = escapeHtml(
    order.customer?.phone || ""
  );

  const total = formatINR(order.totalPrice);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation</title>
</head>

<body style="
  margin:0;
  padding:20px;
  background:#f5f7fa;
  font-family:Arial,sans-serif;
">

<div style="
  max-width:700px;
  margin:auto;
  background:#ffffff;
  padding:30px;
  border-radius:12px;
">

<h1 style="color:#0284c7;">
  Order Confirmed 🎉
</h1>

<p>
  Hello <strong>${customerName}</strong>,
</p>

<p>
  Thank you for your order.
  We have successfully received it.
</p>

<p>
  <strong>Order ID:</strong>
  ${orderId}
</p>

<table style="
  width:100%;
  border-collapse:collapse;
">

<thead>
<tr>

<th style="
  text-align:left;
  padding:12px;
  background:#f3f4f6;
">
  Product
</th>

<th style="
  padding:12px;
  background:#f3f4f6;
">
  Qty
</th>

<th style="
  text-align:right;
  padding:12px;
  background:#f3f4f6;
">
  Amount
</th>

</tr>
</thead>

<tbody>
${renderItems(order.items)}
</tbody>

</table>

<h2>
  Total: ${total}
</h2>

<h3>
  Delivery Address
</h3>

<p>
${addressHtml(order)}
</p>

<p>
  <strong>Phone:</strong>
  ${phone}
</p>

<p>
  <strong>Payment:</strong>
  Cash on Delivery
</p>

<p>
  We will keep you updated about your order.
</p>

<hr>

<p style="
  color:#777;
  font-size:12px;
">
  Waventra Vetric
</p>

</div>

</body>
</html>`;

  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmation - #${order._id}`,
    html,
  });
};

/**
 * Admin new-order notification.
 */
const sendAdminOrderNotification = async (order) => {
  const adminEmail = String(
    process.env.ORDER_NOTIFICATION_EMAIL || ""
  )
    .trim()
    .toLowerCase();

  if (!adminEmail) {
    console.warn(
      "ORDER_NOTIFICATION_EMAIL is not configured"
    );

    return null;
  }

  const items = (
    Array.isArray(order.items)
      ? order.items
      : []
  )
    .map((item) => {
      const quantity = Number(
        item.quantity || 1
      );

      const price = Number(
        item.price || 0
      );

      return `
        <li style="margin-bottom:8px;">
          <strong>
            ${escapeHtml(
              item.name || "Product"
            )}
          </strong>

          × ${quantity}

          —
          ${formatINR(
            quantity * price
          )}
        </li>
      `;
    })
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Order Received</title>
</head>

<body style="
  font-family:Arial,sans-serif;
  background:#f5f7fa;
  padding:20px;
">

<div style="
  max-width:700px;
  margin:auto;
  background:#ffffff;
  padding:30px;
  border-radius:12px;
">

<h1 style="color:#16a34a;">
  New Order Received 🛒
</h1>

<h2>
  Order ID:
  ${escapeHtml(order._id)}
</h2>

<h3>
  Customer
</h3>

<p>

<strong>Name:</strong>
${escapeHtml(
  order.customer?.name || ""
)}

<br>

<strong>Email:</strong>
${escapeHtml(
  order.customer?.email || ""
)}

<br>

<strong>Phone:</strong>
${escapeHtml(
  order.customer?.phone || ""
)}

</p>

<h3>
  Products
</h3>

<ul>
${items}
</ul>

<h2>
  Total:
  ${formatINR(order.totalPrice)}
</h2>

<h3>
  Delivery Address
</h3>

<p>
${addressHtml(order)}
</p>

<p>
<strong>Payment:</strong>
Cash on Delivery
</p>

<p>
<strong>Status:</strong>
${escapeHtml(
  order.status || "Pending"
)}
</p>

</div>

</body>
</html>`;

  return sendEmail({
    to: adminEmail,
    subject:
      `New Order Received - #${order._id}`,
    html,
  });
};

/**
 * Customer order status update email.
 */
const sendOrderStatusEmail = async (order) => {
  const customerEmail = String(
    order.customer?.email || ""
  )
    .trim()
    .toLowerCase();

  if (!customerEmail) {
    return null;
  }

  const status = escapeHtml(
    order.status || "Pending"
  );

  const customerName = escapeHtml(
    order.customer?.name || "Customer"
  );

  const orderId = escapeHtml(
    order._id
  );

  const reason = order.cancellationReason
    ? `
      <p>
        <strong>
          Cancellation reason:
        </strong>

        ${escapeHtml(
          order.cancellationReason
        )}
      </p>
    `
    : "";

  const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Update</title>
</head>

<body style="
  margin:0;
  padding:20px;
  background:#f5f7fa;
  font-family:Arial,sans-serif;
">

<div style="
  max-width:650px;
  margin:auto;
  background:#ffffff;
  padding:30px;
  border-radius:12px;
">

<h1>
  Order Update
</h1>

<p>
  Hello <strong>${customerName}</strong>,
</p>

<p>
  Your order
  <strong>#${orderId}</strong>
  is now
  <strong>${status}</strong>.
</p>

${reason}

<p>
  <strong>Payment:</strong>
  Cash on Delivery
</p>

<p>
  <strong>Total:</strong>
  ${formatINR(order.totalPrice)}
</p>

<hr>

<p style="
  color:#777;
  font-size:12px;
">
  Waventra Vetric
</p>

</div>

</body>
</html>`;

  return sendEmail({
    to: customerEmail,
    subject:
      `Order Update - #${order._id} - ${order.status}`,
    html,
  });
};

module.exports = {
  verifyEmailConnection,
  sendEmail,
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
  sendOrderStatusEmail,
};