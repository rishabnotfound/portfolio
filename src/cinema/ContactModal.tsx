import { useEffect, useRef, useState, type FormEvent } from "react";
import { config } from "../config";

type Status = { kind: "idle" | "sending" | "sent" | "error"; msg?: string };

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStatus((s) => (s.kind === "sent" ? { kind: "idle" } : s));
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (data._honey) return;
    setStatus({ kind: "sending" });
    try {
      const r = await fetch(config.contact.form!, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...data, _subject: `Portfolio: message from ${data.name}`, _template: "table", _replyto: data.email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) !== "true") throw new Error(j.message || `Request failed (${r.status})`);
      form.reset();
      setStatus({ kind: "sent" });
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className={`cx-modal${open ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="cx-contact-title" hidden={!open}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="cx-form" onSubmit={submit}>
        <button type="button" className="cx-menu-close" onClick={onClose}>CLOSE ✕</button>
        <h2 id="cx-contact-title" className="cx-dot-type">SAY HELLO</h2>
        {status.kind === "sent" ? (
          <div className="cx-form-done">
            <p>Message sent. I&apos;ll get back to you within 24hrs.</p>
            <button type="button" onClick={onClose}>&gt; BACK TO THE SITE</button>
          </div>
        ) : (
          <>
            <label><span>NAME</span><input ref={first} name="name" required maxLength={80} autoComplete="name" /></label>
            <label><span>EMAIL</span><input name="email" type="email" required maxLength={120} autoComplete="email" /></label>
            <label><span>MESSAGE</span><textarea name="message" required maxLength={4000} rows={5} /></label>
            <input name="_honey" tabIndex={-1} autoComplete="off" className="cx-honey" aria-hidden="true" />
            <div className="cx-form-foot">
              <button type="submit" disabled={status.kind === "sending"}>{status.kind === "sending" ? "SENDING…" : "> SEND MESSAGE"}</button>
              <a href={`mailto:${config.person.email}`}>OR MAIL {config.person.email.toUpperCase()}</a>
            </div>
            {status.kind === "error" && <p className="cx-form-error" role="alert">{status.msg}</p>}
          </>
        )}
      </form>
    </div>
  );
}
