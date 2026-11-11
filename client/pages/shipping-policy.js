import Link from "next/link";

import InfoPage, { Detail } from "../components/InfoPage";
import { DeliveryIllustration } from "../components/Illustrations";
import siteConfig from "../lib/siteConfig";

export default function ShippingPolicy() {
  return (
    <InfoPage
      path="/shipping-policy"
      eyebrow="Policy"
      title="Shipping and delivery"
      lead="How your order gets from our warehouse to your door, and how to follow it on the way."
      illustration={<DeliveryIllustration />}
    >
      <div className="ui-grid ui-cols-3" style={{ marginBottom: 40 }}>
        <div className="ui-card"><span className="ui-muted ui-small">Dispatch</span><h3 style={{ marginTop: 6 }}><Detail value={siteConfig.dispatchTime} /></h3></div>
        <div className="ui-card"><span className="ui-muted ui-small">Delivery</span><h3 style={{ marginTop: 6 }}><Detail value={siteConfig.deliveryTime} /></h3></div>
        <div className="ui-card"><span className="ui-muted ui-small">Shipping charge</span><h3 style={{ marginTop: 6 }}>Shown at checkout</h3></div>
      </div>

      <div className="ui-grid ui-cols-2" style={{ alignItems: "start" }}>
        <div className="ui-prose">
          <h2 style={{ marginTop: 0 }}>What happens after you order</h2>
          <ol className="wvinfo-steps">
            <li><div><strong>Order placed</strong><span>You receive a confirmation email and the order appears under Orders as Pending.</span></div></li>
            <li><div><strong>Confirmed and prepared</strong><span>We confirm the order and pack it. You can still cancel online until preparation starts.</span></div></li>
            <li><div><strong>Shipped</strong><span>The order status changes to Shipped. Any courier and tracking details we add are shown on the order page.</span></div></li>
            <li><div><strong>Delivered</strong><span>The status changes to Delivered. Your {siteConfig.returnWindowDays}-day return window starts on this date.</span></div></li>
          </ol>

          <h2>Shipping charges</h2>
          <p>The shipping charge for your order is calculated at checkout and shown before you pay. It is also listed on your invoice.</p>

          <h2>Delivery areas</h2>
          <p><span className="wvinfo-fill">[List where you deliver, for example: all serviceable PIN codes in India. Mention any areas you do not deliver to.]</span></p>

          <h2>Damaged or missing items</h2>
          <p>
            If your parcel arrives damaged or something is missing, please <Link href="/returns-policy">request a return</Link> from the order page
            or contact us at <Detail value={siteConfig.supportEmail} /> as soon as possible.
          </p>
        </div>

        <div className="ui-card">
          <h3>Track an order</h3>
          <p className="ui-muted" style={{ lineHeight: 1.65 }}>Sign in to see the live status and history of every order you have placed.</p>
          <Link href="/orders" className="ui-btn ui-sm">Go to my orders</Link>
        </div>
      </div>
    </InfoPage>
  );
}
