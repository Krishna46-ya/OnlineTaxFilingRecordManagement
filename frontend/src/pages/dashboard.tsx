"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate }                       from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// ─── Theme ────────────────────────────────────────────────────────────────────
const NAVY    = "#1B3A6B";
const SAFFRON = "#FF7B00";
const GREEN   = "#006B3C";
const LIGHT   = "#F4F7FB";
const ERROR   = "#D9363E";
const DARK    = "#0A1628";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  userId: string;
  email:  string;
}

interface TaxRecord {
  id:            string;
  financialYear: string;
  totalIncome:   number;
  taxableIncome: number;
  taxCalculated: number;
  taxPaid:       number;
  status:        string;
  createdAt:     string;
  balance:       number;
  taxStatus:     "REFUND" | "DUE" | "SETTLED";
}

interface FilingForm {
  financialYear:   string;
  salaryIncome:    string;
  businessIncome:  string;
  capitalGains:    string;
  otherIncome:     string;
  section80C:      string;
  section80D:      string;
  section80E:      string;
  otherDeductions: string;
  taxPaid:         string;
}

interface ZodIssue { path: (string | number)[]; message: string; }
type FieldErrors = Partial<Record<keyof FilingForm, string>>;
type Section     = "overview" | "records" | "file";
type FormStatus  = "idle" | "loading" | "success" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inr = (n: number) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const mapZodErrors = (issues: ZodIssue[]): FieldErrors => {
  const e: FieldErrors = {};
  for (const i of issues) {
    const f = i.path[0] as keyof FilingForm | undefined;
    if (f && !e[f]) e[f] = i.message;
  }
  return e;
};

const CURRENT_FY = (() => {
  const now = new Date();
  const y   = now.getFullYear();
  return now.getMonth() < 3 ? `${y - 1}-${y}` : `${y}-${y + 1}`;
})();

const BLANK_FORM: FilingForm = {
  financialYear:   CURRENT_FY,
  salaryIncome:    "",
  businessIncome:  "0",
  capitalGains:    "0",
  otherIncome:     "0",
  section80C:      "0",
  section80D:      "0",
  section80E:      "0",
  otherDeductions: "0",
  taxPaid:         "",
};

// ─── Ashoka Chakra ────────────────────────────────────────────────────────────
function AshokaChakra({ size = 40, color = "#fff", spin = false, opacity = 1 }:
  { size?: number; color?: string; spin?: boolean; opacity?: number }) {
  const spokes = Array.from({ length: 24 }).map((_, i) => {
    const a = (i * 15 - 90) * (Math.PI / 180);
    return { x: 50 + 42 * Math.cos(a), y: 50 + 42 * Math.sin(a) };
  });
  return (
    <motion.svg width={size} height={size} viewBox="0 0 100 100"
      style={{ opacity, flexShrink: 0 }}
      animate={spin ? { rotate: 360 } : {}}
      transition={spin ? { duration: 60, repeat: Infinity, ease: "linear" } : {}}
    >
      <circle cx="50" cy="50" r="48"  fill="none" stroke={color} strokeWidth="1.8" opacity="0.55" />
      <circle cx="50" cy="50" r="5.5" fill={color} opacity="0.85" />
      {spokes.map((pt, i) => (
        <line key={i} x1="50" y1="50" x2={pt.x} y2={pt.y} stroke={color} strokeWidth="1.1" opacity="0.72" />
      ))}
      {spokes.map((pt, i) => (
        <circle key={`d${i}`} cx={pt.x} cy={pt.y} r="1.8" fill={color} opacity="0.85" />
      ))}
    </motion.svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" fill="none" stroke={`${color}33`} strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </motion.svg>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: -16 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const errorAnim: Variants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  show:   { opacity: 1, height: "auto", marginTop: 6, transition: { duration: 0.25 } },
  exit:   { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.18 } },
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ s }: { s: "REFUND" | "DUE" | "SETTLED" | string }) {
  const cfg = {
    REFUND:  { bg: "rgba(0,107,60,0.1)",  color: GREEN,   label: "Refund"  },
    DUE:     { bg: "rgba(217,54,62,0.1)", color: ERROR,   label: "Due"     },
    SETTLED: { bg: "rgba(27,58,107,0.1)", color: NAVY,    label: "Settled" },
  }[s] ?? { bg: "#f0f0f0", color: "#666", label: s };

  return (
    <span style={{
      background: cfg.bg, color: cfg.color, fontSize: 11,
      fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview",       icon: "▦" },
  { id: "records",  label: "Filed Returns",  icon: "≡" },
  { id: "file",     label: "File New Return", icon: "+" },
];

// ─── Filing form fields ───────────────────────────────────────────────────────
const INCOME_FIELDS: { key: keyof FilingForm; label: string; hint?: string }[] = [
  { key: "salaryIncome",   label: "Salary Income",   hint: "Standard deduction of ₹50,000 auto-applied" },
  { key: "businessIncome", label: "Business Income" },
  { key: "capitalGains",   label: "Capital Gains" },
  { key: "otherIncome",    label: "Other Income" },
];

const DED_FIELDS: { key: keyof FilingForm; label: string; cap?: string }[] = [
  { key: "section80C",      label: "Section 80C",       cap: "Max ₹1,50,000" },
  { key: "section80D",      label: "Section 80D",       cap: "Max ₹25,000"   },
  { key: "section80E",      label: "Section 80E (Edu Loan Interest)" },
  { key: "otherDeductions", label: "Other Deductions" },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [authLoading, setAuthLoading] = useState(true);
  const [user,        setUser       ] = useState<User | null>(null);
  const [records,     setRecords    ] = useState<TaxRecord[]>([]);
  const [recLoading,  setRecLoading ] = useState(false);

  const [section,     setSection    ] = useState<Section>("overview");
  const [form,        setForm       ] = useState<FilingForm>(BLANK_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [formStatus,  setFormStatus ] = useState<FormStatus>("idle");
  const [focusedField, setFocused   ] = useState<keyof FilingForm | null>(null);
  const [successRecord, setSuccessRecord] = useState<any>(null);
  const [sidebarOpen,  setSidebarOpen   ] = useState(false);

  // ── Font injection ─────────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'DM Sans', sans-serif; background: ${LIGHT}; }
      .inp {
        width: 100%; padding: 10px 12px; font-size: 13.5px;
        font-family: 'DM Sans', sans-serif; border-radius: 8px;
        outline: none; background: #FAFBFD; color: #0D1B3E;
        transition: border-color .22s, box-shadow .22s, background .22s;
      }
      .inp:focus { background: #fff; }
      .inp::placeholder { color: #BCC3D4; }
      input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px #fafbfd inset !important; -webkit-text-fill-color: #0D1B3E !important; }
      button { font-family: 'DM Sans', sans-serif; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #DDE2EE; border-radius: 4px; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/me", { credentials: "include" });
        if (!res.ok) { navigate("/signin"); return; }
        const data = await res.json();
        setUser(data.user);
      } catch {
        navigate("/signin");
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [navigate]);

  // ── Load records ───────────────────────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    setRecLoading(true);
    try {
      const res = await fetch("http://localhost:3000/tax/records", { credentials: "include" });
      if (res.status === 401) { navigate("/signin"); return; }
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch {
      setRecords([]);
    } finally {
      setRecLoading(false);
    }
  }, [navigate]);

  useEffect(() => { if (!authLoading) loadRecords(); }, [authLoading, loadRecords]);

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try { await fetch("/auth/signout", { method: "POST", credentials: "include" }); } catch {}
    navigate("/signin");
  };

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handleChange = (key: keyof FilingForm, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    setFieldErrors(p => ({ ...p, [key]: undefined }));
    setGlobalError(null);
  };

  const handleFileSubmit = async () => {
    if (formStatus === "loading") return;
    setFormStatus("loading");
    setFieldErrors({});
    setGlobalError(null);

    const payload = {
      financialYear:   form.financialYear,
      salaryIncome:    parseFloat(form.salaryIncome)    || 0,
      businessIncome:  parseFloat(form.businessIncome)  || 0,
      capitalGains:    parseFloat(form.capitalGains)    || 0,
      otherIncome:     parseFloat(form.otherIncome)     || 0,
      section80C:      parseFloat(form.section80C)      || 0,
      section80D:      parseFloat(form.section80D)      || 0,
      section80E:      parseFloat(form.section80E)      || 0,
      otherDeductions: parseFloat(form.otherDeductions) || 0,
      taxPaid:         parseFloat(form.taxPaid)         || 0,
    };

    try {
      const res  = await fetch("http://localhost:3000/tax/file", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && Array.isArray(data.errors)) {
          setFieldErrors(mapZodErrors(data.errors as ZodIssue[]));
        } else {
          setGlobalError(data.msg ?? "Something went wrong. Please try again.");
        }
        setFormStatus("error");
        return;
      }

      setSuccessRecord(data);
      setFormStatus("success");
      setForm(BLANK_FORM);
      await loadRecords();
    } catch {
      setGlobalError("Network error. Please check your connection.");
      setFormStatus("error");
    }
  };

  // ── Auth loading screen ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <AshokaChakra size={52} color="rgba(255,255,255,0.3)" spin />
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Verifying session…</p>
      </div>
    );
  }

  const top3 = records.slice(0, 3);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: LIGHT, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        style={{
          width: 232, flexShrink: 0,
          background: DARK,
          display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh", overflowY: "auto",
          zIndex: 50,
        }}
      >
        {/* Tricolor top */}
        <div style={{ display: "flex", height: 4 }}>
          <div style={{ flex: 1, background: SAFFRON }} />
          <div style={{ flex: 1, background: "#fff", opacity: 0.3 }} />
          <div style={{ flex: 1, background: GREEN }} />
        </div>

        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AshokaChakra size={32} color="rgba(255,255,255,0.7)" />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF", fontFamily: "'Crimson Pro', serif", lineHeight: 1.25 }}>
                Income Tax Portal
              </div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 1 }}>
                Govt. of India
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, paddingLeft: 8 }}>
            Menu
          </div>
          {NAV.map(({ id, label, icon }) => {
            const active = section === id;
            return (
              <motion.button
                key={id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSection(id);
                  if (id === "file") { setFormStatus("idle"); setSuccessRecord(null); }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 12px", borderRadius: 9,
                  border: "none", cursor: "pointer", marginBottom: 4,
                  background: active ? "rgba(255,123,0,0.14)" : "transparent",
                  color:      active ? SAFFRON : "rgba(255,255,255,0.5)",
                  fontSize: 13.5, fontWeight: active ? 600 : 400,
                  textAlign: "left", transition: "color .2s, background .2s",
                  borderLeft: active ? `3px solid ${SAFFRON}` : "3px solid transparent",
                }}
              >
                <span style={{ fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                {label}
              </motion.button>
            );
          })}

          {/* Records count badge */}
          {records.length > 0 && (
            <div style={{ marginTop: 4, paddingLeft: 12 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 400 }}>
                {records.length} return{records.length !== 1 ? "s" : ""} filed
              </span>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Signed in as</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontWeight: 500, marginBottom: 12, wordBreak: "break-all" }}>
            {user?.email}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSignOut}
            style={{
              width: "100%", padding: "8px 0", borderRadius: 7, border: "none",
              background: "rgba(217,54,62,0.12)", color: "#F47F82",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}
          >
            Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: "auto", minHeight: "100vh" }}>

        {/* Top header bar */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #E4E9F2",
          padding: "0 32px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
          boxShadow: "0 1px 12px rgba(27,58,107,0.06)",
        }}>
          <div>
            <span style={{ fontSize: 13, color: "#8B97B5", fontWeight: 500 }}>
              Assessment Year&nbsp;
            </span>
            <span style={{ fontSize: 13, color: NAVY, fontWeight: 700 }}>
              {CURRENT_FY}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Page body ─────────────────────────────────────────────────────── */}
        <div style={{ padding: "32px" }}>
          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════════════════════════════════
                OVERVIEW
            ════════════════════════════════════════════════════════════════ */}
            {section === "overview" && (
              <motion.div key="overview" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }}>

                {/* Greeting */}
                <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
                  <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 30, fontWeight: 800, color: NAVY, letterSpacing: "-0.02em", marginBottom: 4 }}>
                    Good day, Taxpayer 👋
                  </h1>
                  <p style={{ fontSize: 14, color: "#8B97B5" }}>
                    Here's a summary of your income tax filings and account status.
                  </p>
                </motion.div>

                {/* Quick stat cards */}
                <motion.div variants={stagger} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
                  {[
                    {
                      label: "Total Returns Filed",
                      value: records.length,
                      suffix: "",
                      color: NAVY,
                      icon: "📄",
                    },
                    {
                      label: "Total Tax Paid",
                      value: inr(records.reduce((s, r) => s + r.taxPaid, 0)),
                      suffix: "",
                      color: GREEN,
                      icon: "💰",
                    },
                    {
                      label: "Pending Dues",
                      value: inr(records.filter(r => r.taxStatus === "DUE").reduce((s, r) => s + r.balance, 0)),
                      suffix: "",
                      color: ERROR,
                      icon: "⚠️",
                    },
                    {
                      label: "Latest Filing",
                      value: records[0]?.financialYear ?? "—",
                      suffix: "",
                      color: SAFFRON,
                      icon: "🗓️",
                    },
                  ].map(card => (
                    <motion.div key={card.label} variants={fadeUp} style={{
                      background: "#fff", borderRadius: 14, padding: "20px 22px",
                      border: "1.5px solid #E4E9F2",
                      boxShadow: "0 2px 14px rgba(27,58,107,0.05)",
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 10 }}>{card.icon}</div>
                      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1 }}>
                        {card.value}
                      </div>
                      <div style={{ fontSize: 12, color: "#8B97B5", marginTop: 5, fontWeight: 500 }}>{card.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Recent returns */}
                <motion.div variants={fadeUp}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 21, fontWeight: 700, color: NAVY }}>
                      Recent Filings
                    </h2>
                    {records.length > 3 && (
                      <motion.button whileHover={{ x: 3 }} onClick={() => setSection("records")}
                        style={{ fontSize: 13, color: SAFFRON, fontWeight: 600, border: "none", background: "none", cursor: "pointer" }}>
                        View all ({records.length}) →
                      </motion.button>
                    )}
                  </div>

                  {recLoading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
                      <Spinner color={NAVY} size={28} />
                    </div>
                  ) : top3.length === 0 ? (
                    <EmptyState onFile={() => setSection("file")} />
                  ) : (
                    <motion.div variants={stagger} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                      {top3.map((rec, i) => (
                        <RecordCard key={rec.id} rec={rec} rank={i + 1} />
                      ))}
                    </motion.div>
                  )}
                </motion.div>

                {/* CTA banner */}
                {records.length > 0 && (
                  <motion.div variants={fadeUp} style={{
                    marginTop: 28, background: `linear-gradient(135deg, ${DARK} 0%, ${NAVY} 100%)`,
                    borderRadius: 14, padding: "24px 28px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 14, position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", right: -30, top: -30, opacity: 0.07, pointerEvents: "none" }}>
                      <AshokaChakra size={180} color="#fff" spin />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Crimson Pro', serif", marginBottom: 4 }}>
                        Ready to file for FY {CURRENT_FY}?
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                        Due date: <strong style={{ color: "rgba(255,255,255,0.8)" }}>31 July {CURRENT_FY.split("-")[1]}</strong>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.04, boxShadow: "0 10px 28px rgba(255,123,0,0.45)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSection("file")}
                      style={{
                        padding: "11px 24px", borderRadius: 9, border: "none",
                        background: SAFFRON, color: "#fff",
                        fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                        boxShadow: "0 5px 18px rgba(255,123,0,0.35)",
                        position: "relative", zIndex: 1,
                      }}
                    >
                      e-File ITR →
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                ALL RECORDS
            ════════════════════════════════════════════════════════════════ */}
            {section === "records" && (
              <motion.div key="records" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
                  <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 28, fontWeight: 800, color: NAVY, letterSpacing: "-0.02em", marginBottom: 4 }}>
                    Filed Returns
                  </h1>
                  <p style={{ fontSize: 13.5, color: "#8B97B5" }}>
                    Complete history of income tax returns filed through this portal.
                  </p>
                </motion.div>

                {recLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner color={NAVY} size={30} /></div>
                ) : records.length === 0 ? (
                  <EmptyState onFile={() => setSection("file")} />
                ) : (
                  <motion.div variants={stagger} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {records.map((rec, i) => (
                      <motion.div key={rec.id} variants={slideIn} custom={i}>
                        <RecordRow rec={rec} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                FILE NEW RETURN
            ════════════════════════════════════════════════════════════════ */}
            {section === "file" && (
              <motion.div key="file" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
                  <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 28, fontWeight: 800, color: NAVY, letterSpacing: "-0.02em", marginBottom: 4 }}>
                    File New Return
                  </h1>
                  <p style={{ fontSize: 13.5, color: "#8B97B5" }}>
                    Enter your income and deduction details for FY {form.financialYear}. Tax is computed under the Old Regime.
                  </p>
                </motion.div>

                {/* Success state */}
                <AnimatePresence>
                  {formStatus === "success" && successRecord && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{   opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        background: "#fff", borderRadius: 16, padding: "32px 28px",
                        border: `1.5px solid ${GREEN}44`,
                        boxShadow: "0 12px 40px rgba(0,107,60,0.08)",
                        maxWidth: 680,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ fontSize: 32 }}>✅</div>
                        <div>
                          <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, fontWeight: 700, color: NAVY }}>
                            Return Filed Successfully
                          </div>
                          <div style={{ fontSize: 13, color: "#8B97B5", marginTop: 2 }}>
                            Record ID: <code style={{ fontSize: 11.5, background: "#f0f3fa", padding: "2px 6px", borderRadius: 4 }}>{successRecord.record.id}</code>
                          </div>
                        </div>
                      </div>

                      {/* Tax summary grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
                        {[
                          { label: "Total Income",    value: inr(successRecord.summary.income.totalIncome) },
                          { label: "Total Deductions", value: inr(successRecord.summary.deductions.totalDeductions) },
                          { label: "Taxable Income",  value: inr(successRecord.summary.tax.taxableIncome) },
                          { label: "Tax Calculated",  value: inr(successRecord.summary.tax.taxCalculated) },
                          { label: "Tax Paid",        value: inr(successRecord.summary.tax.taxPaid) },
                          { label: "Balance",         value: (successRecord.summary.tax.balance < 0 ? "+" : "") + inr(Math.abs(successRecord.summary.tax.balance)) },
                        ].map(it => (
                          <div key={it.label} style={{ background: LIGHT, borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ fontSize: 11, color: "#8B97B5", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{it.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "'Crimson Pro', serif" }}>{it.value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        padding: "12px 16px", borderRadius: 9,
                        background: successRecord.summary.tax.taxStatus.code === "REFUND" ? "rgba(0,107,60,0.07)"
                          : successRecord.summary.tax.taxStatus.code === "DUE" ? "rgba(217,54,62,0.07)"
                          : "rgba(27,58,107,0.06)",
                        border: `1px solid ${successRecord.summary.tax.taxStatus.code === "REFUND" ? GREEN + "33" : successRecord.summary.tax.taxStatus.code === "DUE" ? ERROR + "33" : NAVY + "22"}`,
                        fontSize: 13.5, fontWeight: 600,
                        color: successRecord.summary.tax.taxStatus.code === "REFUND" ? GREEN : successRecord.summary.tax.taxStatus.code === "DUE" ? ERROR : NAVY,
                        marginBottom: 20,
                      }}>
                        {successRecord.summary.tax.taxStatus.msg}
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => { setFormStatus("idle"); setSuccessRecord(null); setSection("records"); }}
                          style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: NAVY, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                          View All Records →
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => { setFormStatus("idle"); setSuccessRecord(null); setForm(BLANK_FORM); }}
                          style={{ padding: "10px 22px", borderRadius: 8, border: `1.5px solid #DDE2EE`, background: "transparent", color: NAVY, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                          File Another
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                {formStatus !== "success" && (
                  <div style={{ maxWidth: 720 }}>

                    {/* Global error */}
                    <AnimatePresence>
                      {globalError && (
                        <motion.div key="g" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                          style={{ overflow: "hidden", marginBottom: 20 }}>
                          <div style={{ background: "rgba(217,54,62,0.07)", border: "1px solid rgba(217,54,62,0.22)", borderRadius: 9, padding: "12px 16px", display: "flex", gap: 10 }}>
                            <span style={{ fontSize: 14 }}>⚠️</span>
                            <span style={{ fontSize: 13.5, color: ERROR, lineHeight: 1.5 }}>{globalError}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* FY selector */}
                    <motion.div variants={fadeUp} style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", border: "1.5px solid #E4E9F2", marginBottom: 16 }}>
                      <FieldLabel label="Financial Year" />
                      <input className="inp" type="text" value={form.financialYear}
                        onChange={e => handleChange("financialYear", e.target.value)}
                        placeholder="YYYY-YYYY" maxLength={9}
                        style={{ border: `1.5px solid ${fieldErrors.financialYear ? ERROR : focusedField === "financialYear" ? NAVY : "#DDE2EE"}` }}
                        onFocus={() => setFocused("financialYear")} onBlur={() => setFocused(null)}
                      />
                      <AnimatePresence>
                        {fieldErrors.financialYear && (
                          <motion.div key="fe" variants={errorAnim} initial="hidden" animate="show" exit="exit" style={{ overflow: "hidden" }}>
                            <span style={{ fontSize: 12.5, color: ERROR }}>✕ {fieldErrors.financialYear}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Income section */}
                    <FormSection title="Income Details" icon="💼" variants={fadeUp}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {INCOME_FIELDS.map(f => (
                          <FieldBlock key={f.key} f={f} form={form} fieldErrors={fieldErrors}
                            focusedField={focusedField} onChange={handleChange} setFocused={setFocused} />
                        ))}
                      </div>
                    </FormSection>

                    {/* Deductions section */}
                    <FormSection title="Deductions (Old Regime)" icon="📋" variants={fadeUp}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {DED_FIELDS.map(f => (
                          <FieldBlock key={f.key} f={f} form={form} fieldErrors={fieldErrors}
                            focusedField={focusedField} onChange={handleChange} setFocused={setFocused} />
                        ))}
                      </div>
                    </FormSection>

                    {/* Tax paid */}
                    <FormSection title="Tax Already Paid" icon="✅" variants={fadeUp}>
                      <p style={{ fontSize: 12.5, color: "#8B97B5", marginBottom: 12 }}>
                        Include TDS deducted by employer, advance tax paid, and self-assessment tax.
                      </p>
                      <div style={{ maxWidth: 280 }}>
                        <FieldBlock
                          f={{ key: "taxPaid", label: "Total Tax Paid (₹)" }}
                          form={form} fieldErrors={fieldErrors}
                          focusedField={focusedField} onChange={handleChange} setFocused={setFocused}
                        />
                      </div>
                    </FormSection>

                    {/* Submit */}
                    <motion.div variants={fadeUp} style={{ marginTop: 20 }}>
                      <motion.button
                        whileHover={formStatus !== "loading" ? { scale: 1.015, boxShadow: "0 12px 30px rgba(255,123,0,0.42)" } : {}}
                        whileTap={formStatus !== "loading"   ? { scale: 0.98  } : {}}
                        onClick={handleFileSubmit}
                        disabled={formStatus === "loading"}
                        style={{
                          padding: "14px 36px", borderRadius: 10, border: "none",
                          background: formStatus === "loading" ? "rgba(27,58,107,0.6)" : SAFFRON,
                          color: "#fff", fontSize: 15, fontWeight: 600,
                          cursor: formStatus === "loading" ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", gap: 10,
                          boxShadow: formStatus !== "loading" ? "0 6px 20px rgba(255,123,0,0.32)" : "none",
                          transition: "background .25s",
                        }}
                      >
                        {formStatus === "loading" ? <><Spinner /><span>Filing Return…</span></> : "Submit ITR →"}
                      </motion.button>
                      <p style={{ fontSize: 11.5, color: "#A0AAC0", marginTop: 10 }}>
                        By submitting, you confirm the above information is accurate to the best of your knowledge.
                      </p>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#2D3A5A", marginBottom: 7, letterSpacing: "0.01em" }}>
      {label}
    </label>
  );
}

function FieldBlock({ f, form, fieldErrors, focusedField, onChange, setFocused }: {
  f:            { key: keyof FilingForm; label: string; hint?: string; cap?: string };
  form:         FilingForm;
  fieldErrors:  FieldErrors;
  focusedField: keyof FilingForm | null;
  onChange:     (k: keyof FilingForm, v: string) => void;
  setFocused:   (k: keyof FilingForm | null) => void;
}) {
  const hasErr   = Boolean(fieldErrors[f.key]);
  const isFoc    = focusedField === f.key;
  const border   = hasErr ? ERROR : isFoc ? NAVY : "#DDE2EE";
  const shadow   = isFoc ? "0 0 0 3px rgba(27,58,107,0.09)" : "none";

  return (
    <div>
      <FieldLabel label={f.label} />
      {(f.cap || f.hint) && !hasErr && (
        <div style={{ fontSize: 11, color: "#A8B0C4", marginBottom: 5, lineHeight: 1.4 }}>
          {f.cap ?? f.hint}
        </div>
      )}
      <input className="inp" type="number" min="0" placeholder="0"
        value={form[f.key]}
        onChange={e => onChange(f.key, e.target.value)}
        onFocus={() => setFocused(f.key)}
        onBlur={() => setFocused(null)}
        style={{ border: `1.5px solid ${border}`, boxShadow: shadow }}
      />
      <AnimatePresence>
        {hasErr && (
          <motion.div key="e" variants={errorAnim} initial="hidden" animate="show" exit="exit" style={{ overflow: "hidden" }}>
            <span style={{ fontSize: 12, color: ERROR }}>✕ {fieldErrors[f.key]}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormSection({ title, icon, children, variants }: {
  title:    string;
  icon:     string;
  children: React.ReactNode;
  variants: Variants;
}) {
  return (
    <motion.div variants={variants} style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", border: "1.5px solid #E4E9F2", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h3 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 17, fontWeight: 700, color: NAVY }}>
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function RecordCard({ rec, rank }: { rec: TaxRecord; rank: number }) {
  const balance = rec.balance ?? (rec.taxCalculated - rec.taxPaid);
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(27,58,107,0.12)" }}
      transition={{ duration: 0.28 }}
      style={{
        background: "#fff", borderRadius: 14, padding: "20px 22px",
        border: "1.5px solid #E4E9F2",
        boxShadow: "0 2px 12px rgba(27,58,107,0.05)",
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "#A0AAC0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
            FY {rec.financialYear}
          </div>
          <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, fontWeight: 700, color: NAVY }}>
            {inr(rec.totalIncome)}
          </div>
          <div style={{ fontSize: 11.5, color: "#8B97B5", marginTop: 2 }}>Total Income</div>
        </div>
        <StatusBadge s={rec.taxStatus} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Taxable Income", value: inr(rec.taxableIncome) },
          { label: "Tax Calculated", value: inr(rec.taxCalculated) },
          { label: "Tax Paid",       value: inr(rec.taxPaid) },
          { label: balance < 0 ? "Refund" : "Due",
            value: inr(Math.abs(balance)),
            color: balance < 0 ? GREEN : balance > 0 ? ERROR : NAVY },
        ].map(it => (
          <div key={it.label} style={{ background: LIGHT, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: "#A0AAC0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{it.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: it.color ?? NAVY, fontFamily: "'Crimson Pro', serif" }}>{it.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#B0BAD0", marginTop: 12 }}>
        Filed {new Date(rec.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </div>
    </motion.div>
  );
}

function RecordRow({ rec }: { rec: TaxRecord }) {
  const balance = rec.balance ?? (rec.taxCalculated - rec.taxPaid);
  return (
    <motion.div
      whileHover={{ x: 4, boxShadow: "0 8px 28px rgba(27,58,107,0.09)" }}
      transition={{ duration: 0.22 }}
      style={{
        background: "#fff", borderRadius: 12, padding: "16px 22px",
        border: "1.5px solid #E4E9F2",
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}
    >
      <div style={{ minWidth: 100 }}>
        <div style={{ fontSize: 10.5, color: "#A0AAC0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>FY</div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: NAVY, fontFamily: "'Crimson Pro', serif" }}>{rec.financialYear}</div>
      </div>
      {[
        { label: "Total Income",   value: inr(rec.totalIncome) },
        { label: "Taxable Income", value: inr(rec.taxableIncome) },
        { label: "Tax Calculated", value: inr(rec.taxCalculated) },
        { label: "Tax Paid",       value: inr(rec.taxPaid) },
        { label: balance < 0 ? "Refund Due" : "Tax Due",
          value: inr(Math.abs(balance)),
          color: balance < 0 ? GREEN : balance > 0 ? ERROR : NAVY },
      ].map(it => (
        <div key={it.label} style={{ minWidth: 100, flex: 1 }}>
          <div style={{ fontSize: 10.5, color: "#A0AAC0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{it.label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: it.color ?? NAVY, fontFamily: "'Crimson Pro', serif" }}>{it.value}</div>
        </div>
      ))}
      <StatusBadge s={rec.taxStatus} />
      <div style={{ fontSize: 11, color: "#B0BAD0", width: "100%", marginTop: -4 }}>
        Filed {new Date(rec.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        &ensp;·&ensp;<code style={{ fontSize: 10.5, background: LIGHT, padding: "1px 5px", borderRadius: 4 }}>{rec.id.slice(0, 16)}…</code>
      </div>
    </motion.div>
  );
}

function EmptyState({ onFile }: { onFile: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        background: "#fff", borderRadius: 16, padding: "56px 32px",
        border: "1.5px dashed #DDE2EE", textAlign: "center",
      }}
    >
      <AshokaChakra size={52} color={NAVY} opacity={0.12} />
      <h3 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 20, fontWeight: 700, color: NAVY, marginTop: 16, marginBottom: 8 }}>
        No Returns Filed Yet
      </h3>
      <p style={{ fontSize: 13.5, color: "#8B97B5", marginBottom: 22, lineHeight: 1.6 }}>
        You haven't filed any income tax returns on this portal. Get started now.
      </p>
      <motion.button
        whileHover={{ scale: 1.03, boxShadow: "0 10px 26px rgba(255,123,0,0.38)" }}
        whileTap={{ scale: 0.97 }}
        onClick={onFile}
        style={{
          padding: "11px 28px", borderRadius: 9, border: "none",
          background: SAFFRON, color: "#fff",
          fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(255,123,0,0.28)",
        }}
      >
        e-File Your First ITR →
      </motion.button>
    </motion.div>
  );
}