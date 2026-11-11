import Link from "next/link";

import InfoPage, { Detail } from "../components/InfoPage";
import { ReturnsIllustration } from "../components/Illustrations";
import siteConfig from "../lib/siteConfig";

export default function ReturnsPolicy() {
  return (
    <InfoPage
      path="/returns-policy"
      eyebrow="Policy"
      title="Cancellations, returns and refunds"
      lead={`You can cancel before we start preparing your order, and request a return within ${siteConfig.returnWindowDays} days of delivery.`}
      illustration={<ReturnsIllustration />}
    >
      <div className="ui-grid ui-cols-3" style={{ marginBottom: 40 }}>
        <div className="ui-card"><span className="ui-muted ui-small">Return window</span><h3 style={{ marginTop: 6 }}>{siteConfig.returnWindowDays} days from delivery</h3></div>
        <div className="ui-card"><span className="ui-muted ui-small">Refund time</span><h3 style={{ marginTop: 6 }}><Detail value={siteConfig.refundTime} /></h3></div>
        <div className="ui-card"><span className="ui-muted ui-small">Warranty</span><h3 style={{ marginTop: 6 }}><Detail value={siteConfig.warranty} /></h3></div>
      </div>

      <div className="ui-grid ui-cols-2" style={{ alignItems: "start" }}>
        <div className="ui-prose">
          <h2 style={{ marginTop: 0 }}>Cancelling an order</h2>
          <p>
            Open the order under <Link href="/orders">Orders</Link> and choose &ldquo;Cancel order&rdquo;. This is available while the order is
            Pending or Confirmed. After that, please contact support and we will help if the order has not yet shipped.
          </p>

          <h2>Requesting a return</h2>
          <ol className="wvinfo-steps">
            <li><div><strong>Open the delivered order</strong><span>Choose &ldquo;Request a return&rdquo; within {siteConfig.returnWindowDays} days of the delivery date.</span></div></li>
            <li><div><strong>Tell us the reason</strong><span>Pick a reason and add any details that help us understand the problem.</span></div></li>
            <li><div><strong>We review it</strong><span>Our team approves or declines the request and replies on the order page.</span></div></li>
            <li><div><strong>Refund</strong><span>Once an approved return is completed, your refund is issued and the order shows Refunded.</span></div></li>
          </ol>

          <h2>Conditions</h2>
          <p><span className="wvinfo-fill">[List your conditions, for example: items must be unused and in original packaging; which products cannot be returned; who pays return shipping.]</span></p>

          <h2>Refunds</h2>
          <p>
            Refunds are sent to the original payment method. Expected time: <Detail value={siteConfig.refundTime} />.
          </p>
        </div>

        <div className="ui-card">
          <h3>Start a return</h3>
          <p className="ui-muted" style={{ lineHeight: 1.65 }}>Returns are requested from the order itself, so we already have the details we need.</p>
          <div className="ui-row">
            <Link href="/orders" className="ui-btn ui-sm">Go to my orders</Link>
            <Link href="/contact" className="ui-btn ui-ghost ui-sm">Contact support</Link>
          </div>
        </div>
      </div>
    </InfoPage>
  );
}
