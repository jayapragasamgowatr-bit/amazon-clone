import Link from "next/link";
import SEO from "../components/SEO";

export default function PrivacyPolicy() {
  return <>
    <SEO title="Privacy Policy | Waventra Vetric" description="Privacy information for Waventra Vetric customers." path="/privacy-policy" />
    
    <main className="legal-page">
      <div className="legal-card">
        <div className="eyebrow">Legal</div><h1>Privacy Policy</h1>
        <p className="lead">This page explains the types of information the Waventra Vetric website may collect and how that information is used to provide the shopping experience.</p>
        <Section title="1. Information we collect">We may collect information you provide when you create an account, place an order, update your profile, contact support, or use features such as the cart and wishlist. This can include your name, email address, phone number, delivery address, and order information.</Section>
        <Section title="2. How we use information">Information may be used to process orders, provide account features, communicate about orders, provide customer support, improve the website, and help protect the service from misuse.</Section>
        <Section title="3. Payments">Payment information is handled through the payment method or payment provider used by the checkout process. The website should not be treated as storing complete card credentials unless the applicable payment provider explicitly states otherwise.</Section>
        <Section title="4. Cookies and local storage">The website may use cookies, browser storage, or similar technologies for authentication, preferences, cart functionality, security, and improving the user experience.</Section>
        <Section title="5. Sharing information">Information may be shared with service providers when necessary to operate the website, process orders, deliver products, send transactional communications, or maintain technical infrastructure. We do not state that information is sold unless that practice actually applies to the business.</Section>
        <Section title="6. Data security">Reasonable technical and organizational measures should be used to protect account and order information. No internet service can guarantee absolute security.</Section>
        <Section title="7. Your choices">You can review or update account information through available account features and can contact support about questions concerning your information.</Section>
        <Section title="8. Updates">This policy may be updated when website features, business practices, or legal requirements change. The latest version will be published on this page.</Section>
        <p className="note">This is website-ready informational content and should be reviewed against your actual data practices and applicable law before being treated as your final legal policy.</p>
        <Link className="back" href="/">← Back to Home</Link>
      </div>
    </main>
    <style jsx>{styles}</style>
  </>;
}
function Section({title,children}){return <section><h2>{title}</h2><p>{children}</p></section>}
const styles=`.legal-page{max-width:1000px;margin:0 auto;padding:70px 24px 30px;min-height:65vh}.legal-card{border:1px solid rgba(255,255,255,.09);background:rgba(15,23,42,.62);border-radius:22px;padding:clamp(24px,5vw,44px);backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.16)}.eyebrow{color:#67e8f9;font-size:12px;font-weight:900;letter-spacing:1.7px;text-transform:uppercase;margin-bottom:10px}.legal-card h1{margin:0;font-size:clamp(38px,6vw,58px);font-weight:900}.lead{color:#aeb9cd;line-height:1.8;font-size:16px;margin:15px 0 30px}.legal-card section{padding:20px 0;border-top:1px solid rgba(255,255,255,.07)}.legal-card h2{font-size:20px;margin:0 0 9px}.legal-card section p{margin:0;color:#cbd5e1;line-height:1.8}.note{margin:28px 0 18px;padding:15px;border-radius:12px;background:rgba(103,232,249,.05);border:1px solid rgba(103,232,249,.12);color:#9fb0c8;line-height:1.7;font-size:13px}.back{display:inline-block;margin-top:8px;color:#67e8f9;font-weight:800;text-decoration:none}`;
