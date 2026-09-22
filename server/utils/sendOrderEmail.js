const nodemailer = require("nodemailer");

const transporter =
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASSWORD,
    },
  });

async function sendOrderEmail(
  order
) {
  const itemsHtml =
    order.items
      .map(
        (item) => `
          <tr>
            <td style="
              padding:12px;
              border-bottom:1px solid #eee;
            ">
              ${item.name}
            </td>

            <td style="
              padding:12px;
              text-align:center;
              border-bottom:1px solid #eee;
            ">
              ${item.quantity}
            </td>

            <td style="
              padding:12px;
              text-align:right;
              border-bottom:1px solid #eee;
            ">
              ₹${Number(
                item.price
              ).toLocaleString("en-IN")}
            </td>

            <td style="
              padding:12px;
              text-align:right;
              border-bottom:1px solid #eee;
            ">
              ₹${(
                Number(item.price) *
                Number(item.quantity)
              ).toLocaleString("en-IN")}
            </td>
          </tr>
        `
      )
      .join("");

  const mailOptions = {
    from:
      `"Waventra Vetric Orders" <${process.env.EMAIL_USER}>`,

    to:
      process.env.ORDER_NOTIFICATION_EMAIL ||
      "jayaprakasham2004@gmail.com",

    subject:
      `🛒 New Order Received - ${order._id}`,

    html: `
      <!DOCTYPE html>

      <html>
      <head>
        <meta charset="UTF-8">
      </head>

      <body style="
        margin:0;
        padding:0;
        background:#f4f7fb;
        font-family:Arial,sans-serif;
        color:#1f2937;
      ">

        <div style="
          max-width:800px;
          margin:30px auto;
          background:#ffffff;
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 4px 20px rgba(0,0,0,0.08);
        ">

          <!-- HEADER -->

          <div style="
            background:#0f172a;
            color:white;
            padding:25px 30px;
          ">

            <h1 style="
              margin:0;
              font-size:24px;
            ">
              🛒 New Order Received
            </h1>

            <p style="
              margin:8px 0 0;
              color:#cbd5e1;
            ">
              A new customer order has been
              placed on your website.
            </p>

          </div>


          <!-- ORDER -->

          <div style="
            padding:30px;
          ">

            <h2>
              Order Details
            </h2>

            <p>
              <strong>Order ID:</strong>
              ${order._id}
            </p>

            <p>
              <strong>Order Date:</strong>
              ${new Date(
                order.createdAt
              ).toLocaleString("en-IN")}
            </p>


            <!-- CUSTOMER -->

            <h2 style="
              margin-top:30px;
            ">
              Customer Information
            </h2>

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
            >

              <tr>
                <td style="padding:7px 0;">
                  <strong>Name</strong>
                </td>

                <td style="padding:7px 0;">
                  ${order.customer.name}
                </td>
              </tr>

              <tr>
                <td style="padding:7px 0;">
                  <strong>Email</strong>
                </td>

                <td style="padding:7px 0;">
                  ${order.customer.email}
                </td>
              </tr>

              <tr>
                <td style="padding:7px 0;">
                  <strong>Phone</strong>
                </td>

                <td style="padding:7px 0;">
                  ${order.customer.phone}
                </td>
              </tr>

            </table>


            <!-- ADDRESS -->

            <h2 style="
              margin-top:30px;
            ">
              Delivery Address
            </h2>

            <div style="
              padding:18px;
              background:#f8fafc;
              border-radius:10px;
              line-height:1.7;
            ">

              ${order.shippingAddress.address}

              <br>

              ${order.shippingAddress.city},
              ${order.shippingAddress.state}

              <br>

              Pincode:
              ${order.shippingAddress.pincode}

            </div>


            <!-- PRODUCTS -->

            <h2 style="
              margin-top:30px;
            ">
              Ordered Products
            </h2>

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                border-collapse:collapse;
              "
            >

              <thead>

                <tr style="
                  background:#f1f5f9;
                ">

                  <th style="
                    padding:12px;
                    text-align:left;
                  ">
                    Product
                  </th>

                  <th style="
                    padding:12px;
                    text-align:center;
                  ">
                    Qty
                  </th>

                  <th style="
                    padding:12px;
                    text-align:right;
                  ">
                    Price
                  </th>

                  <th style="
                    padding:12px;
                    text-align:right;
                  ">
                    Total
                  </th>

                </tr>

              </thead>

              <tbody>

                ${itemsHtml}

              </tbody>

            </table>


            <!-- TOTAL -->

            <div style="
              margin-top:25px;
              padding:20px;
              background:#f8fafc;
              border-radius:12px;
            ">

              <p style="
                display:flex;
                justify-content:space-between;
              ">
                <strong>Subtotal</strong>

                <span>
                  ₹${Number(
                    order.subtotal
                  ).toLocaleString("en-IN")}
                </span>
              </p>

              <p style="
                display:flex;
                justify-content:space-between;
              ">
                <strong>Shipping</strong>

                <span>
                  ₹${Number(
                    order.shipping
                  ).toLocaleString("en-IN")}
                </span>
              </p>

              <hr>

              <p style="
                font-size:20px;
                display:flex;
                justify-content:space-between;
              ">

                <strong>
                  Total
                </strong>

                <strong>
                  ₹${Number(
                    order.total
                  ).toLocaleString("en-IN")}
                </strong>

              </p>

            </div>


            <!-- STATUS -->

            <div style="
              margin-top:25px;
              padding:15px;
              background:#fff7ed;
              border:1px solid #fed7aa;
              border-radius:10px;
            ">

              <strong>
                Order Status:
              </strong>

              ${order.status}

              <br>

              <strong>
                Payment Status:
              </strong>

              ${order.paymentStatus}

            </div>

          </div>


          <!-- FOOTER -->

          <div style="
            padding:20px 30px;
            background:#f8fafc;
            color:#64748b;
            font-size:13px;
          ">

            This is an automatic order
            notification from your
            e-commerce website.

          </div>

        </div>

      </body>
      </html>
    `,
  };

  return transporter.sendMail(
    mailOptions
  );
}

module.exports =
  sendOrderEmail;