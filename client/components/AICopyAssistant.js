import { useState } from "react";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { generateProductCopy } from "../lib/api";

// ============================================================
// AI COPY ASSISTANT (admin)
// ============================================================
// Drafts a product listing from the details already typed into
// the form. Nothing is saved until the admin presses "Use this".
// ============================================================

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "technical", label: "Technical" },
  { value: "friendly", label: "Friendly" },
];

export default function AICopyAssistant({ details, onApply, applyLabel = "Use this draft" }) {
  const [notes, setNotes] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);

  const generate = async () => {
    if (loading) return;
    if (!String(details?.name || "").trim()) {
      toast.error("Enter the product name first");
      return;
    }

    setLoading(true);
    try {
      const data = await generateProductCopy({
        name: details.name,
        category: details.category || "",
        description: details.description || "",
        specifications: details.specifications || {},
        notes,
        tone,
      });
      setDraft(data?.copy || null);
    } catch (error) {
      toast.error(error?.message || "The AI draft could not be created. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!draft) return;
    onApply(draft);
    toast.success("Draft added to the form. Review it before saving.");
  };

  return (
    <div className="wva-box">
      <div className="wva-head">
        <span className="wva-eyebrow"><Sparkles size={13} /> AI listing writer</span>
        <p>Drafts the description, features and use cases from the name, category and specifications above.</p>
      </div>

      <div className="wva-controls">
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional notes for the AI: key selling points, target customer…"
          aria-label="Notes for the AI"
          maxLength={2000}
        />
        <select value={tone} onChange={(event) => setTone(event.target.value)} aria-label="Writing tone">
          {TONES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button type="button" className="wva-generate" onClick={generate} disabled={loading}>
          {loading ? "Writing…" : draft ? <><RefreshCw size={15} /> Rewrite</> : <><Sparkles size={15} /> Write with AI</>}
        </button>
      </div>

      {draft && (
        <div className="wva-draft">
          {draft.tagline && <p className="wva-tagline">{draft.tagline}</p>}
          <p className="wva-description">{draft.description}</p>

          {draft.features?.length > 0 && (
            <div>
              <h4>Features</h4>
              <ul>{draft.features.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
          {draft.applications?.length > 0 && (
            <div>
              <h4>Applications</h4>
              <ul>{draft.applications.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
          {(draft.seoTitle || draft.seoDescription) && (
            <div className="wva-seo">
              <h4>Search engine preview</h4>
              <strong>{draft.seoTitle}</strong>
              <span>{draft.seoDescription}</span>
            </div>
          )}

          <div className="wva-actions">
            <button type="button" className="wva-apply" onClick={apply}>
              <Check size={15} /> {applyLabel}
            </button>
            <span>AI drafts can contain mistakes. Check every claim against the real product before saving.</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .wva-box { display: grid; gap: 14px; padding: 18px; border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 16px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(99, 102, 241, 0.1)); color: #f8fafc; text-align: left; }
        .wva-box button::before { display: none; }
        .wva-box button:hover { transform: none; filter: none; box-shadow: none; }
        .wva-box button svg { width: 15px; height: 15px; min-width: 0; min-height: 0; }
        .wva-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #67e8f9; }
        .wva-head p { margin: 6px 0 0; font-size: 13px; line-height: 1.5; color: #94a3b8; }
        .wva-controls { display: flex; flex-wrap: wrap; gap: 8px; }
        .wva-controls input { flex: 1; min-width: min(100%, 220px); width: auto; height: 44px; padding: 0 14px; border-radius: 12px; font-size: 14px; }
        .wva-controls select { width: auto; height: 44px; padding: 0 12px; border-radius: 12px; font-size: 14px; }
        .wva-generate, .wva-apply { height: 44px; padding: 0 16px; display: inline-flex; align-items: center; gap: 8px; border: 0; border-radius: 12px; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
        .wva-generate { background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; }
        .wva-generate:disabled { opacity: 0.5; cursor: wait; }
        .wva-draft { display: grid; gap: 14px; padding: 16px; border-radius: 14px; background: rgba(2, 6, 23, 0.45); }
        .wva-tagline { margin: 0; font-size: 16px; font-weight: 800; }
        .wva-description { margin: 0; font-size: 14px; line-height: 1.65; color: #e2e8f0; white-space: pre-wrap; }
        .wva-draft h4 { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
        .wva-draft ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; font-size: 14px; color: #e2e8f0; }
        .wva-seo { display: grid; gap: 2px; }
        .wva-seo strong { font-size: 15px; color: #7dd3fc; }
        .wva-seo span { font-size: 13px; color: #cbd5e1; }
        .wva-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
        .wva-apply { background: #f8fafc; color: #0f172a; }
        .wva-actions span { flex: 1; min-width: 200px; font-size: 12px; line-height: 1.45; color: #94a3b8; }
        .wva-box button:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
      `}</style>
    </div>
  );
}
