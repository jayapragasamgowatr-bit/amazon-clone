/*
|--------------------------------------------------------------------------
| Waventra Vetric - Brevo Transactional Email Service
|--------------------------------------------------------------------------
|
| Brevo API is used instead of Gmail SMTP.
|
| Required environment variables:
|
| BREVO_API_KEY=your_brevo_api_key
| BREVO_SENDER_EMAIL=your_verified_sender_email
| BREVO_SENDER_NAME=Waventra Vetric
| ORDER_NOTIFICATION_EMAIL=your_admin_notification_email
|
|--------------------------------------------------------------------------
*/

const BREVO_API_URL =
  "https://api.brevo.com/v3/smtp/email";

const BREVO_ACCOUNT_URL =
  "https://api.brevo.com/v3/account";

const BREVO_API_KEY = String(
  process.env.BREVO_API_KEY || ""
).trim();

const BREVO_SENDER_EMAIL = String(
  process.env.BREVO_SENDER_EMAIL || ""
)
  .trim()
  .toLowerCase();

const BREVO_SENDER_NAME = String(
  process.env.BREVO_SENDER_NAME ||
    "Waventra Vetric"
).trim();

const ORDER_NOTIFICATION_EMAIL = String(
  process.env.ORDER_NOTIFICATION_EMAIL || ""
)
  .trim()
  .toLowerCase();


/*
|--------------------------------------------------------------------------
| Configuration Check
|--------------------------------------------------------------------------
*/

if (
  BREVO_API_KEY &&
  BREVO_SENDER_EMAIL
) {
  console.log(
    "Brevo transactional email service configured successfully"
  );
} else {
  console.warn(
    "Brevo email service is not fully configured. " +
      "Missing BREVO_API_KEY or BREVO_SENDER_EMAIL."
  );
}


/*
|--------------------------------------------------------------------------
| HTML Escape
|--------------------------------------------------------------------------
|
| Prevents user-provided values from being inserted
| directly into HTML email markup.
|
|--------------------------------------------------------------------------
*/

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");


/*
|--------------------------------------------------------------------------
| Format Indian Rupees
|--------------------------------------------------------------------------
*/

const formatINR = (value) =>
  `₹${Number(value || 0).toLocaleString(
    "en-IN"
  )}`;


/*
|--------------------------------------------------------------------------
| Verify Brevo API Connection
|--------------------------------------------------------------------------
|
| This does NOT send an email.
|
|--------------------------------------------------------------------------
*/

const verifyEmailConnection = async () => {
  if (!BREVO_API_KEY) {
    console.error(
      "Brevo email service is not configured: BREVO_API_KEY is missing."
    );

    return false;
  }

  try {
    const response = await fetch(
      BREVO_ACCOUNT_URL,
      {
        method: "GET",

        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
        },

        signal: AbortSignal.timeout(10000),
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      console.error(
        "Brevo API verification failed:",
        response.status,
        data?.message || data
      );

      return false;
    }

    console.log(
      "Brevo API connection verified successfully"
    );

    if (data?.email) {
      console.log(
        `Brevo account: ${data.email}`
      );
    }

    return true;
  } catch (error) {
    console.error(
      "Brevo API verification failed:",
      error?.message || error
    );

    return false;
  }
};


/*
|--------------------------------------------------------------------------
| Generic Brevo Email Sender
|--------------------------------------------------------------------------
*/

const sendEmail = async ({
  to,
  toName = "",
  subject,
  html,
  text = "",
}) => {
  const recipientEmail = String(
    to || ""
  )
    .trim()
    .toLowerCase();

  if (!recipientEmail) {
    throw new Error(
      "Recipient email is required"
    );
  }

  if (!BREVO_API_KEY) {
    throw new Error(
      "Brevo email service is not configured: BREVO_API_KEY is missing"
    );
  }

  if (!BREVO_SENDER_EMAIL) {
    throw new Error(
      "Brevo email service is not configured: BREVO_SENDER_EMAIL is missing"
    );
  }

  if (!subject) {
    throw new Error(
      "Email subject is required"
    );
  }

  if (!html) {
    throw new Error(
      "Email HTML content is required"
    );
  }

  const recipient = {
    email: recipientEmail,
  };

  if (toName) {
    recipient.name = String(toName);
  }

  const payload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },

    to: [
      recipient,
    ],

    subject: String(subject),

    htmlContent: String(html),

    ...(text
      ? {
          textContent: String(text),
        }
      : {}),
  };

  try {
    const response = await fetch(
      BREVO_API_URL,
      {
        method: "POST",

        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
          "content-type":
            "application/json",
        },

        body: JSON.stringify(
          payload
        ),

        signal: AbortSignal.timeout(
          15000
        ),
      }
    );

    let responseData = null;

    try {
      responseData =
        await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      const message =
        responseData?.message ||
        responseData?.code ||
        "Unknown Brevo API error";

      throw new Error(
        `Brevo email failed (${response.status}): ${message}`
      );
    }

    console.log(
      `Email sent successfully through Brevo: ${
        responseData?.messageId ||
        "message accepted"
      }`
    );

    return responseData;
  } catch (error) {
    console.error(
      "Brevo email sending error:",
      error?.message || error
    );

    throw error;
  }
};


/*
|--------------------------------------------------------------------------
| Render Order Items
|--------------------------------------------------------------------------
*/

const renderItems = (items) =>
  (Array.isArray(items)
    ? items
    : []
  )
    .map((item) => {
      const quantity = Number(
        item?.quantity || 1
      );

      const price = Number(
        item?.price || 0
      );

      return `
        <tr>

          <td style="
            padding:12px;
            border-bottom:1px solid #ddd;
          ">
            ${escapeHtml(
              item?.name ||
                "Product"
            )}
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
            ${formatINR(
              quantity * price
            )}
          </td>

        </tr>
      `;
    })
    .join("");



/*
|--------------------------------------------------------------------------
| Render Shipping Address
|--------------------------------------------------------------------------
*/

const addressHtml = (order) => {
  const address =
    order?.shippingAddress || {};

  return `
    ${escapeHtml(
      address?.address || ""
    )}<br/>

    ${escapeHtml(
      address?.city || ""
    )}<br/>

    ${escapeHtml(
      address?.state || ""
    )}<br/>

    Pincode:
    ${escapeHtml(
      address?.postalCode ||
        address?.pincode ||
        ""
    )}
  `;
};


/*
|--------------------------------------------------------------------------
| CUSTOMER ORDER CONFIRMATION EMAIL
|--------------------------------------------------------------------------
*/

const sendOrderConfirmationEmail =
  async (order) => {
    const customerEmail =
      String(
        order?.customer?.email ||
          ""
      )
        .trim()
        .toLowerCase();

    if (!customerEmail) {
      throw new Error(
        "Customer email is missing from order"
      );
    }

    const customerName =
      escapeHtml(
        order?.customer?.name ||
          "Customer"
      );

    const orderId =
      escapeHtml(
        order?._id || ""
      );

    const phone =
      escapeHtml(
        order?.customer?.phone ||
          ""
      );

    const total = formatINR(
      order?.totalPrice
    );

    const html = `
<!doctype html>

<html>

<head>

  <meta charset="UTF-8">

  <title>
    Order Confirmation
  </title>

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

<h1 style="
  color:#0284c7;
">
  Order Confirmed 🎉
</h1>

<p>
  Hello
  <strong>
    ${customerName}
  </strong>,
</p>

<p>
  Thank you for your order.
  We have successfully received it.
</p>

<p>
  <strong>
    Order ID:
  </strong>

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

${renderItems(
  order?.items
)}

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

<strong>
  Phone:
</strong>

${phone}

</p>


<p>

<strong>
  Payment:
</strong>

Cash on Delivery

</p>


<p>
  We will keep you updated
  about your order.
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

</html>
`;

    return sendEmail({
      to: customerEmail,

      toName:
        order?.customer?.name ||
        "Customer",

      subject:
        `Order Confirmation - #${order._id}`,

      html,
    });
  };


/*
|--------------------------------------------------------------------------
| ADMIN NEW ORDER NOTIFICATION
|--------------------------------------------------------------------------
*/

const sendAdminOrderNotification =
  async (order) => {
    const adminEmail =
      String(
        ORDER_NOTIFICATION_EMAIL
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
      Array.isArray(
        order?.items
      )
        ? order.items
        : []
    )
      .map((item) => {
        const quantity =
          Number(
            item?.quantity || 1
          );

        const price =
          Number(
            item?.price || 0
          );

        return `
          <li style="
            margin-bottom:8px;
          ">

            <strong>
              ${escapeHtml(
                item?.name ||
                  "Product"
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

    const html = `
<!doctype html>

<html>

<head>

  <meta charset="UTF-8">

  <title>
    New Order Received
  </title>

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

<h1 style="
  color:#16a34a;
">
  New Order Received 🛒
</h1>


<h2>

  Order ID:

  ${escapeHtml(
    order?._id || ""
  )}

</h2>


<h3>
  Customer
</h3>


<p>

<strong>
  Name:
</strong>

${escapeHtml(
  order?.customer?.name ||
    ""
)}

<br>


<strong>
  Email:
</strong>

${escapeHtml(
  order?.customer?.email ||
    ""
)}

<br>


<strong>
  Phone:
</strong>

${escapeHtml(
  order?.customer?.phone ||
    ""
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

  ${formatINR(
    order?.totalPrice
  )}

</h2>


<h3>
  Delivery Address
</h3>


<p>

${addressHtml(order)}

</p>


<p>

<strong>
  Payment:
</strong>

Cash on Delivery

</p>


<p>

<strong>
  Status:
</strong>

${escapeHtml(
  order?.status ||
    "Pending"
)}

</p>

</div>

</body>

</html>
`;

    return sendEmail({
      to: adminEmail,

      subject:
        `New Order Received - #${order._id}`,

      html,
    });
  };


/*
|--------------------------------------------------------------------------
| CUSTOMER ORDER STATUS EMAIL
|--------------------------------------------------------------------------
*/

const sendOrderStatusEmail =
  async (order) => {
    const customerEmail =
      String(
        order?.customer?.email ||
          ""
      )
        .trim()
        .toLowerCase();

    if (!customerEmail) {
      return null;
    }

    const status =
      escapeHtml(
        order?.status ||
          "Pending"
      );

    const customerName =
      escapeHtml(
        order?.customer?.name ||
          "Customer"
      );

    const orderId =
      escapeHtml(
        order?._id || ""
      );

    const reason =
      order?.cancellationReason
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

    const html = `
<!doctype html>

<html>

<head>

  <meta charset="UTF-8">

  <title>
    Order Update
  </title>

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

  Hello

  <strong>
    ${customerName}
  </strong>,

</p>


<p>

  Your order

  <strong>
    #${orderId}
  </strong>

  is now

  <strong>
    ${status}
  </strong>.

</p>


${reason}


<p>

  <strong>
    Payment:
  </strong>

  Cash on Delivery

</p>


<p>

  <strong>
    Total:
  </strong>

  ${formatINR(
    order?.totalPrice
  )}

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

</html>
`;

    return sendEmail({
      to: customerEmail,

      toName:
        order?.customer?.name ||
        "Customer",

      subject:
        `Order Update - #${order._id} - ${order.status}`,

      html,
    });
  };


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  verifyEmailConnection,
  sendEmail,
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
  sendOrderStatusEmail,
};