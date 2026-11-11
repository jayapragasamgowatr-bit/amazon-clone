import Link from "next/link";

import InfoPage, { Detail } from "../components/InfoPage";
import { SupportIllustration } from "../components/Illustrations";
import siteConfig from "../lib/siteConfig";

// Answers describe how this website works. Company-specific promises
// (delivery times, warranty) come from lib/siteConfig.js.
const GROUPS = [
  {
    title: "Choosing a product",
    items: [
      { q: "How do I find the right product for my application?", a: <>Describe what you need in plain language on the <Link href="/semantic-search">smart search</Link> page or to the <Link href="/assistant">AI assistant</Link>, for example the pipe size, the liquid and your budget. Both search our live catalogue.</> },
      { q: "Can I compare products?", a: <>Yes. Open a product and choose &ldquo;Add to compare&rdquo;, then visit the <Link href="/compare">compare page</Link> to see prices, stock and specifications side by side.</> },
      { q: "I have a technical question about a product.", a: <>Use &ldquo;Ask our team&rdquo; on the product page. Our staff reply publicly so other customers can see the answer. For a quick answer based on the listing, use &ldquo;Ask about this product&rdquo; on the same page.</> },
    ],
  },
  {
    title: "Orders and payment",
    items: [
      { q: "How do I track my order?", a: <>Sign in and open <Link href="/orders">Orders</Link>. Each order shows its current status and history.</> },
      { q: "Can I cancel an order?", a: <>You can cancel from the order page while the order is Pending or Confirmed. Once we start preparing it, please contact support.</> },
      { q: "How do I use a coupon code?", a: <>Enter the code in the coupon box at checkout. The discount is shown before you place the order. One coupon can be used per order.</> },
      { q: "Where is my invoice?", a: <>Open the order and choose &ldquo;Invoice&rdquo;. You can print it or save it as a PDF.</> },
    ],
  },
  {
    title: "Delivery and returns",
    items: [
      { q: "How long does delivery take?", a: <>Orders are dispatched in <Detail value={siteConfig.dispatchTime} /> and usually arrive in <Detail value={siteConfig.deliveryTime} />. See the <Link href="/shipping-policy">shipping policy</Link>.</> },
      { q: "How do I return a product?", a: <>Open the delivered order within {siteConfig.returnWindowDays} days of delivery and choose &ldquo;Request a return&rdquo;. Our team reviews the request and replies on the order page. See the <Link href="/returns-policy">returns policy</Link>.</> },
      { q: "What warranty do products have?", a: <><Detail value={siteConfig.warranty} /></> },
    ],
  },
  {
    title: "Your account",
    items: [
      { q: "How do I change my password or address?", a: <>Go to <Link href="/account">My account</Link>. You can update your name, change your password and save delivery addresses there.</> },
      { q: "I forgot my password.", a: <>Use <Link href="/forgot-password">Forgot password</Link> on the sign-in page and we will email you a reset link.</> },
    ],
  },
];

export default function FAQ() {
  return (
    <InfoPage
      path="/faq"
      eyebrow="Help"
      title="Frequently asked questions"
      lead="Quick answers about choosing products, ordering, delivery, returns and your account."
      illustration={<SupportIllustration />}
    >
      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="wvinfo-group">{group.title}</h2>
          <div className="wvinfo-faq">
            {group.items.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <div>{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="ui-card ui-spread" style={{ marginTop: 40 }}>
        <div>
          <strong>Still need help?</strong>
          <div className="ui-muted ui-small">Our team is available {siteConfig.supportHours}.</div>
        </div>
        <div className="ui-row">
          <Link href="/ai-support" className="ui-btn ui-sm">Ask AI support</Link>
          <Link href="/contact" className="ui-btn ui-ghost ui-sm">Contact us</Link>
        </div>
      </div>
    </InfoPage>
  );
}
