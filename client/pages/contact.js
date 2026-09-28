import { useState } from "react";
import Link from "next/link";
import SEO from "../components/SEO";

export default function Contact(){
 const [sent,setSent]=useState(false);
 const [form,setForm]=useState({name:"",email:"",message:""});
 const submit=(e)=>{
  e.preventDefault();
  if(!form.name.trim()||!form.email.trim()||!form.message.trim()) return;
  const subject=encodeURIComponent(`Waventra Vetric enquiry from ${form.name.trim()}`);
  const body=encodeURIComponent(`Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\n\nMessage:\n${form.message.trim()}`);
  window.location.href=`mailto:jayaprakasham2004@gmail.com?subject=${subject}&body=${body}`;
  setSent(true);
 };
 return <>
 <SEO title="Contact | Waventra Vetric" description="Contact Waventra Vetric support." path="/contact" />
 <main className="contact-page"><div className="hero"><div className="eyebrow">Support</div><h1>Contact</h1><p>Have a question about a product, order, account, or website feature? Send a message using the form below.</p></div>
 <div className="grid"><section className="card"><h2>Send us a message</h2>{sent?<div className="success"><strong>Message form submitted.</strong><p>Your email application should open with the message addressed to our support email. If it does not open automatically, email us directly at <a href="mailto:jayaprakasham2004@gmail.com">jayaprakasham2004@gmail.com</a>.</p><button onClick={()=>setSent(false)}>Send another message</button></div>:<form onSubmit={submit}><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></label><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></label><label>Message<textarea rows="7" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required /></label><button type="submit">Send Message</button></form>}</section>
 <section className="card info"><h2>Waventra Vetric</h2><p>For order-related questions, keep your order number available so the support team can assist you faster.</p><div className="quick"><Link href="/orders">My Orders</Link><Link href="/help-center">Help Center</Link><Link href="/">Home</Link></div></section></div></main><style jsx>{styles}</style></>}
const styles=`.contact-page{max-width:1050px;margin:0 auto;padding:70px 24px 30px;min-height:65vh}.hero{text-align:center;max-width:760px;margin:0 auto 36px}.eyebrow{color:#67e8f9;font-size:12px;font-weight:900;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:10px}.hero h1{margin:0;font-size:clamp(38px,6vw,58px);font-weight:900}.hero p{margin:14px 0 0;color:#aeb9cd;line-height:1.75}.grid{display:grid;grid-template-columns:1.35fr .8fr;gap:18px}.card{border:1px solid rgba(255,255,255,.09);background:rgba(15,23,42,.62);border-radius:22px;padding:28px;backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.16)}.card h2{margin:0 0 20px;font-size:21px}form{display:grid;gap:15px}label{display:grid;gap:7px;color:#cbd5e1;font-weight:800;font-size:13px}input,textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.045);color:#f8fafc;padding:12px 13px;outline:none;font:inherit}textarea{resize:vertical}input:focus,textarea:focus{border-color:rgba(103,232,249,.45)}button{border:0;border-radius:12px;padding:12px 16px;background:#06b6d4;color:#04111d;font-weight:900;cursor:pointer}.info p{color:#aeb9cd;line-height:1.75}.quick{display:grid;gap:10px;margin-top:22px}.quick a{padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.08);color:#e2e8f0;text-decoration:none;background:rgba(255,255,255,.04);font-weight:800}.success{color:#cbd5e1;line-height:1.7}.success strong{color:#67e8f9}.success a{color:#67e8f9}.success button{margin-top:10px}@media(max-width:800px){.grid{grid-template-columns:1fr}.contact-page{padding-top:45px}}`;
