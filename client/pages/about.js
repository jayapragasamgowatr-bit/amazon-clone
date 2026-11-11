import Link from "next/link";

import InfoPage, { Detail } from "../components/InfoPage";
import { FlowIllustration } from "../components/Illustrations";
import siteConfig, { formatAddress } from "../lib/siteConfig";

const VALUES = [
  { title: "Clear specifications", text: "Every listing shows the specifications we hold for the product, so you can check the fit before you order." },
  { title: "Help choosing", text: "Describe your application to our AI assistant, compare products side by side, or ask our team a question on any product page." },
  { title: "Order visibility", text: "Track each order from confirmation to delivery, download your invoice and request a return from your account." },
];

export default function About() {
  return (
    <InfoPage
      path="/about"
      eyebrow="About us"
      title={`About ${siteConfig.name}`}
      lead={`${siteConfig.tagline}. We help customers find the right product for their application and stay informed from order to delivery.`}
      illustration={<FlowIllustration />}
    >
      <div className="ui-grid ui-cols-3" style={{ marginBottom: 40 }}>
        {VALUES.map((item) => (
          <div className="ui-card" key={item.title}>
            <h3>{item.title}</h3>
            <p className="ui-muted" style={{ margin: 0, lineHeight: 1.65 }}>{item.text}</p>
          </div>
        ))}
      </div>

      <div className="ui-grid ui-cols-2" style={{ alignItems: "start" }}>
        <div className="ui-prose">
          <h2 style={{ marginTop: 0 }}>Who we are</h2>
          <p>
            {siteConfig.name} is operated by <Detail value={siteConfig.legalName} />, founded in <Detail value={siteConfig.founded} />.
          </p>
          <p>
            <span className="wvinfo-fill">[Write two or three sentences here about your company: what you make or supply, who your customers are, and what you are known for.]</span>
          </p>
          <h2>How to reach us</h2>
          <p>
            Our support team is available {siteConfig.supportHours}. You can also get an instant answer from the{" "}
            <Link href="/ai-support">AI support assistant</Link> at any time.
          </p>
        </div>

        <div className="ui-card">
          <h3>Company details</h3>
          <dl className="ui-stack" style={{ margin: 0 }}>
            <div><dt className="ui-muted ui-small">Registered name</dt><dd style={{ margin: 0 }}><Detail value={siteConfig.legalName} /></dd></div>
            <div><dt className="ui-muted ui-small">Address</dt><dd style={{ margin: 0 }}>{formatAddress()}</dd></div>
            <div><dt className="ui-muted ui-small">GSTIN</dt><dd style={{ margin: 0 }}><Detail value={siteConfig.gstin} /></dd></div>
            <div><dt className="ui-muted ui-small">Email</dt><dd style={{ margin: 0 }}><Detail value={siteConfig.supportEmail} /></dd></div>
            <div><dt className="ui-muted ui-small">Phone</dt><dd style={{ margin: 0 }}><Detail value={siteConfig.supportPhone} /></dd></div>
          </dl>
          <div className="ui-row" style={{ marginTop: 18 }}>
            <Link href="/products" className="ui-btn ui-sm">Browse products</Link>
            <Link href="/contact" className="ui-btn ui-ghost ui-sm">Contact us</Link>
          </div>
        </div>
      </div>
    </InfoPage>
  );
}
