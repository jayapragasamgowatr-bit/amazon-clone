import { useState } from "react";
import Link from "next/link";
import SEO from "../components/SEO";

const faqs = [
  ["How do I place an order?", "Open the Products page, choose a product, select the quantity, add it to your cart, and continue to checkout."],
  ["Can I change my cart before checkout?", "Yes. Open Cart to change quantities or remove items before placing the order."],
  ["How can I check my orders?", "After signing in, open Orders from the header or footer to view your order history and order details."],
  ["Can I cancel an order?", "Cancellation depends on the current order status. Open the order details page to see the available action."],
  ["How do I manage my wishlist?", "Use the Wishlist page to view products you have saved and move back to the product page when you are ready to shop."],
  ["I forgot my password. What should I do?", "Use Forgot Password on the login page and follow the reset instructions sent to your registered email address."],
];

export default function HelpCenter() {
  const [open, setOpen] = useState(0);
  return (
    <>
      <SEO title="Help Center | Waventra Vetric" description="Help and frequently asked questions for Waventra Vetric." path="/help-center" />
      <main className="support-page">
        <div className="hero">
          <div className="eyebrow">Support</div>
          <h1>Help Center</h1>
          <p>Find quick answers about products, orders, checkout, accounts, and your wishlist.</p>
        </div>
        <section className="faq-list">
          {faqs.map(([question, answer], index) => (
            <div className="faq" key={question}>
              <button type="button" className="faq-button" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}>
                <span>{question}</span><span>{open === index ? "−" : "+"}</span>
              </button>
              {open === index && <div className="answer">{answer}</div>}
            </div>
          ))}
        </section>
        <div className="support-links">
          <Link href="/products">Browse Products</Link>
          <Link href="/orders">View Orders</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </main>
      <style jsx>{`
        .support-page{max-width:1050px;margin:0 auto;padding:72px 24px 30px;min-height:65vh}.hero{text-align:center;max-width:760px;margin:0 auto 38px}.eyebrow{color:#67e8f9;font-size:12px;font-weight:900;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:10px}.hero h1{margin:0;font-size:clamp(38px,6vw,58px);font-weight:900}.hero p{margin:14px 0 0;color:#aeb9cd;line-height:1.75;font-size:16px}.faq-list{display:grid;gap:12px}.faq{border:1px solid rgba(255,255,255,.09);background:rgba(15,23,42,.62);border-radius:18px;overflow:hidden;backdrop-filter:blur(16px)}.faq-button{width:100%;border:0;background:transparent;color:inherit;padding:20px 22px;display:flex;justify-content:space-between;align-items:center;gap:20px;text-align:left;font-size:16px;font-weight:800;cursor:pointer}.faq-button span:last-child{font-size:24px;color:#67e8f9;line-height:1}.answer{padding:0 22px 21px;color:#aeb9cd;line-height:1.75}.support-links{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:28px}.support-links a{padding:11px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);color:#e2e8f0;font-weight:800;text-decoration:none}.support-links a:hover{border-color:rgba(103,232,249,.35);transform:translateY(-1px)}
      `}</style>
    </>
  );
}
