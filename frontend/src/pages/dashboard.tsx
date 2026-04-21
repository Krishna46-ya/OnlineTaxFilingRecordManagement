import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────────────
interface User {
  userId: string;
  email: string;
}

interface TaxRecord {
  id: string;
  financialYear: string;
  salaryIncome: number;
  businessIncome: number;
  capitalGains: number;
  otherIncome: number;
  totalIncome: number;
  section80C: number;
  section80D: number;
  section80E: number;
  otherDeductions: number;
  totalDeductions: number;
  taxableIncome: number;
  taxCalculated: number;
  taxPaid: number;
  status: "VALID" | "ERROR";
  createdAt: string;
}

interface TaxStatus {
  type: "REFUND" | "DUE" | "SETTLED";
  amount?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtShort = (n: number) => {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(2)} L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`;
  return `${n}`;
};

// ── Mock records ───────────────────────────────────────────────────────────
const MOCK_RECORDS: TaxRecord[] = [
  {
    id: "clx1a",
    financialYear: "2024-25",
    salaryIncome: 1200000,
    businessIncome: 0,
    capitalGains: 50000,
    otherIncome: 30000,
    totalIncome: 1280000,
    section80C: 150000,
    section80D: 25000,
    section80E: 0,
    otherDeductions: 10000,
    totalDeductions: 185000,
    taxableIncome: 1095000,
    taxCalculated: 171500,
    taxPaid: 185000,
    status: "VALID",
    createdAt: "2025-07-14T10:23:00Z",
  },
  {
    id: "clx4d",
    financialYear: "2023-24",
    salaryIncome: 980000,
    businessIncome: 120000,
    capitalGains: 0,
    otherIncome: 15000,
    totalIncome: 1115000,
    section80C: 150000,
    section80D: 20000,
    section80E: 0,
    otherDeductions: 5000,
    totalDeductions: 175000,
    taxableIncome: 940000,
    taxCalculated: 132500,
    taxPaid: 132500,
    status: "VALID",
    createdAt: "2024-07-10T08:45:00Z",
  },
  {
    id: "clx7g",
    financialYear: "2022-23",
    salaryIncome: 750000,
    businessIncome: 0,
    capitalGains: 200000,
    otherIncome: 0,
    totalIncome: 950000,
    section80C: 100000,
    section80D: 15000,
    section80E: 30000,
    otherDeductions: 0,
    totalDeductions: 145000,
    taxableIncome: 805000,
    taxCalculated: 82600,
    taxPaid: 70000,
    status: "ERROR",
    createdAt: "2023-08-02T14:12:00Z",
  },
];

// ── Ashoka Chakra ──────────────────────────────────────────────────────────
function AshokaChakra({ size = 400, opacity = 0.06 }: { size?: number; opacity?: number }) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
      <circle cx={r} cy={r} r={r - 3} stroke="white" strokeWidth="5" fill="none" />
      <circle cx={r} cy={r} r={r * 0.13} stroke="white" strokeWidth="4" fill="none" />
      <circle cx={r} cy={r} r={r * 0.07} fill="white" />
      {Array.from({ length: 24 }, (_, i) => {
        const a = ((i * 360) / 24) * (Math.PI / 180);
        return (
          <line
            key={i}
            x1={r + r * 0.13 * Math.cos(a)} y1={r + r * 0.13 * Math.sin(a)}
            x2={r + (r - 4) * Math.cos(a)} y2={r + (r - 4) * Math.sin(a)}
            stroke="white" strokeWidth="3" strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function MiniChakra() {
  const r = 19;
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      <circle cx={r} cy={r} r={r - 1} stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx={r} cy={r} r="2.2" fill="white" />
      {Array.from({ length: 24 }, (_, i) => {
        const a = ((i * 360) / 24) * (Math.PI / 180);
        return (
          <line key={i}
            x1={r + 3.5 * Math.cos(a)} y1={r + 3.5 * Math.sin(a)}
            x2={r + 16 * Math.cos(a)} y2={r + 16 * Math.sin(a)}
            stroke="white" strokeWidth="1.1" strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, delay, icon }: {
  label: string; value: string; sub?: string; accent: string; delay: number; icon: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14, padding: "22px 22px", position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: accent, borderRadius: "14px 14px 0 0",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase", margin: 0, marginBottom: 10,
          }}>{label}</p>
          <p style={{
            fontSize: 28, fontWeight: 800, color: "#fff", margin: 0,
            fontFamily: "'Playfair Display', serif", lineHeight: 1.1,
          }}>₹{value}</p>
          {sub && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", margin: 0, marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${accent}20`, border: `1px solid ${accent}35`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
        }}>{icon}</div>
      </div>
    </motion.div>
  );
}

function CountCard({ label, value, color, delay, icon }: {
  label: string; value: number; color: string; delay: number; icon: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14, padding: "22px 22px", position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: color, borderRadius: "14px 14px 0 0",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase", margin: 0, marginBottom: 10,
          }}>{label}</p>
          <p style={{
            fontSize: 48, fontWeight: 800, color: "#fff", margin: 0,
            fontFamily: "'Playfair Display', serif", lineHeight: 1,
          }}>{value}</p>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${color}20`, border: `1px solid ${color}35`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
        }}>{icon}</div>
      </div>
    </motion.div>
  );
}

// ── Record Drawer ──────────────────────────────────────────────────────────
function RecordDrawer({ record, onClose }: { record: TaxRecord; onClose: () => void }) {
  const diff = record.taxPaid - record.taxCalculated;
  const rows: [string, string][] = [
    ["Financial Year", `AY ${record.financialYear}`],
    ["Salary Income", fmtINR(record.salaryIncome)],
    ["Business Income", fmtINR(record.businessIncome)],
    ["Capital Gains", fmtINR(record.capitalGains)],
    ["Other Income", fmtINR(record.otherIncome)],
    ["Total Income", fmtINR(record.totalIncome)],
    ["Sec. 80C", fmtINR(record.section80C)],
    ["Sec. 80D", fmtINR(record.section80D)],
    ["Sec. 80E", fmtINR(record.section80E)],
    ["Other Deductions", fmtINR(record.otherDeductions)],
    ["Total Deductions", fmtINR(record.totalDeductions)],
    ["Taxable Income", fmtINR(record.taxableIncome)],
    ["Tax Calculated", fmtINR(record.taxCalculated)],
    ["Tax Paid", fmtINR(record.taxPaid)],
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(8,16,50,0.75)", backdropFilter: "blur(6px)",
        zIndex: 200, display: "flex", justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, background: "#0d1b4b",
          borderLeft: "1px solid rgba(255,255,255,0.09)",
          height: "100%", overflowY: "auto", display: "flex", flexDirection: "column",
        }}
      >
        <div style={{
          background: "rgba(255,102,0,0.1)",
          borderBottom: "1px solid rgba(255,102,0,0.2)",
          padding: "28px 32px",
          position: "sticky", top: 0, zIndex: 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Tax Return</p>
              <h2 style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "6px 0 0", fontWeight: 700 }}>
                AY {record.financialYear}
              </h2>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)", width: 36, height: 36, borderRadius: 8,
              cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
              background: record.status === "VALID" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
              color: record.status === "VALID" ? "#4ade80" : "#f87171",
              border: `1px solid ${record.status === "VALID" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              letterSpacing: "0.08em",
            }}>{record.status}</span>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
              background: diff >= 0 ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
              color: diff >= 0 ? "#4ade80" : "#f87171",
              border: `1px solid ${diff >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              letterSpacing: "0.08em",
            }}>
              {diff > 0 ? `REFUND ₹${fmtShort(diff)}` : diff < 0 ? `DUE ₹${fmtShort(Math.abs(diff))}` : "SETTLED"}
            </span>
          </div>
        </div>

        <div style={{ padding: "8px 32px 32px", flex: 1 }}>
          {rows.map(([label, val], i) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0",
              borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.055)" : "none",
            }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
            <button style={{
              flex: 1, padding: "13px", borderRadius: 10,
              border: "1.5px solid rgba(255,255,255,0.18)",
              background: "transparent", color: "#fff", fontWeight: 700,
              cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif",
            }}>✎  Edit</button>
            <button style={{
              flex: 1, padding: "13px", borderRadius: 10,
              border: "1.5px solid rgba(239,68,68,0.45)",
              background: "rgba(239,68,68,0.08)", color: "#f87171", fontWeight: 700,
              cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif",
            }}>⊗  Delete</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [records] = useState<TaxRecord[]>(MOCK_RECORDS);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedRecord, setSelectedRecord] = useState<TaxRecord | null>(null);

  // Auth
  useEffect(() => {
    fetch("http://localhost:3000/me", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) { window.location.href = "/"; return; }
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => { window.location.href = "/"; })
      .finally(() => setLoading(false));
  }, []);

  const totalRecords = records.length;
  const validRecords = records.filter((r) => r.status === "VALID").length;
  const errorRecords = records.filter((r) => r.status === "ERROR").length;
  const totalIncome = records.reduce((s, r) => s + r.totalIncome, 0);
  const totalTax = records.reduce((s, r) => s + r.taxCalculated, 0);
  const overallDiff = records.reduce((s, r) => s + (r.taxPaid - r.taxCalculated), 0);

  const taxStatus: TaxStatus =
    overallDiff > 0 ? { type: "REFUND", amount: overallDiff }
    : overallDiff < 0 ? { type: "DUE", amount: Math.abs(overallDiff) }
    : { type: "SETTLED" };

  const statusConfig = {
    REFUND: { label: "Refund Eligible", color: "#4ade80", bg: "rgba(34,197,94,0.13)", border: "rgba(34,197,94,0.28)" },
    DUE: { label: "Tax Outstanding", color: "#f87171", bg: "rgba(239,68,68,0.13)", border: "rgba(239,68,68,0.28)" },
    SETTLED: { label: "Fully Settled", color: "#60a5fa", bg: "rgba(96,165,250,0.13)", border: "rgba(96,165,250,0.28)" },
  }[taxStatus.type];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "records", label: "Tax Records", icon: "≡" },
    { id: "file", label: "File Return", icon: "+" },
    { id: "refund", label: "Track Refund", icon: "↩" },
    { id: "profile", label: "My Profile", icon: "◎" },
  ];

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a1340",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18,
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <MiniChakra />
        </motion.div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Nunito', sans-serif" }}>
          Verifying Session…
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { font-family: 'Nunito', sans-serif; background: #0a1340; }
        ::-webkit-scrollbar { width: 5px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        button { font-family: 'Nunito', sans-serif; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#0a1340" }}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <motion.aside
          initial={{ x: -260 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          style={{
            width: 256, background: "#0d1b4b",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            position: "fixed", top: 0, left: 0, bottom: 0,
            display: "flex", flexDirection: "column", zIndex: 50,
          }}
        >
          {/* Brand */}
          <div style={{ padding: "26px 22px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <MiniChakra />
              <div>
                <p style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 13.5, lineHeight: 1.3 }}>
                  Income Tax<br />e-Filing Portal
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: "0.12em", marginTop: 3, textTransform: "uppercase" }}>
                  Ministry of Finance · Govt. of India
                </p>
              </div>
            </div>
          </div>

          {/* AY pill */}
          <div style={{ padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,102,0,0.13)", border: "1px solid rgba(255,102,0,0.28)",
              borderRadius: 20, padding: "5px 12px",
            }}>
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6600", display: "inline-block" }}
              />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#FF9933", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                AY 2025–26 · Filing Open
              </span>
            </div>
          </div>

          {/* User */}
          <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "linear-gradient(135deg, #FF6600, #ff9933)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "'Playfair Display', serif",
                flexShrink: 0,
              }}>
                {user?.email?.charAt(0).toUpperCase() ?? "U"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email?.split("@")[0] ?? "Taxpayer"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email ?? ""}
                </p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "14px 12px", flex: 1 }}>
            {navItems.map((item, i) => {
              const active = activeNav === item.id;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.2 }}
                  onClick={() => setActiveNav(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 11, width: "100%",
                    padding: "10px 13px", borderRadius: 9, border: "none", cursor: "pointer",
                    background: active ? "rgba(255,102,0,0.13)" : "transparent",
                    color: active ? "#FF9933" : "rgba(255,255,255,0.42)",
                    fontWeight: active ? 800 : 500, fontSize: 13.5,
                    marginBottom: 2, transition: "all 0.15s", textAlign: "left",
                    borderLeft: active ? "2.5px solid #FF6600" : "2.5px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                </motion.button>
              );
            })}
          </nav>

          {/* Sign out */}
          <div style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 13px", borderRadius: 9, border: "none", cursor: "pointer",
                background: "transparent", color: "rgba(255,255,255,0.28)",
                fontSize: 13, fontWeight: 600, transition: "color 0.15s",
              }}
            >
              <span>⏻</span> Sign Out
            </button>
            <p style={{ color: "rgba(255,255,255,0.13)", fontSize: 9, textAlign: "center", letterSpacing: "0.07em", marginTop: 12, lineHeight: 1.8, textTransform: "uppercase" }}>
              © Income Tax Department<br />Ministry of Finance, India
            </p>
          </div>
        </motion.aside>

        {/* ── Main ──────────────────────────────────────── */}
        <main style={{ marginLeft: 256, flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "sticky", top: 0, zIndex: 40,
              background: "rgba(13,27,75,0.96)", backdropFilter: "blur(18px)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              padding: "15px 36px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 21, color: "#fff" }}>
                Taxpayer Dashboard
              </h1>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12.5, marginTop: 2 }}>
                Welcome back, {user?.email?.split("@")[0]}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: statusConfig.bg, border: `1px solid ${statusConfig.border}`,
                borderRadius: 20, padding: "7px 15px",
              }}>
                <span style={{ width: 6.5, height: 6.5, borderRadius: "50%", background: statusConfig.color, display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: statusConfig.color }}>
                  {statusConfig.label}
                  {taxStatus.amount ? ` · ₹${fmtShort(taxStatus.amount)}` : ""}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  background: "#FF6600", color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                  boxShadow: "0 4px 22px rgba(255,102,0,0.38)",
                }}
              >
                e-File Your ITR →
              </motion.button>
            </div>
          </motion.header>

          {/* Page body */}
          <div style={{ flex: 1, padding: "34px 36px 60px", position: "relative", overflow: "hidden" }}>

            {/* Chakra watermark */}
            <div style={{ position: "absolute", right: -80, top: -60, pointerEvents: "none", zIndex: 0 }}>
              <AshokaChakra size={460} opacity={0.042} />
            </div>

            {/* AY badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 26,
                background: "rgba(255,102,0,0.1)", border: "1px solid rgba(255,102,0,0.22)",
                borderRadius: 20, padding: "6px 16px",
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF6600", display: "inline-block" }}
              />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#FF9933", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Assessment Year 2025–26 · Filing Now Open
              </span>
            </motion.div>

            {/* Row 1: Count cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 14, position: "relative", zIndex: 1 }}>
              <CountCard label="Total Filings" value={totalRecords} color="#FF6600" delay={0.08} icon="📋" />
              <CountCard label="Valid Returns" value={validRecords} color="#4ade80" delay={0.15} icon="✓" />
              <CountCard label="Records with Errors" value={errorRecords} color="#f87171" delay={0.22} icon="⚠" />
            </div>

            {/* Row 2: Money cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 26, position: "relative", zIndex: 1 }}>
              <StatCard label="Total Income Across All Years" value={fmtShort(totalIncome)} sub="Sum of all filed returns" accent="#60a5fa" delay={0.3} icon="₹" />
              <StatCard
                label="Total Tax Liability"
                value={fmtShort(totalTax)}
                sub={overallDiff >= 0 ? `Refund due: ₹${fmtShort(overallDiff)}` : `Balance due: ₹${fmtShort(Math.abs(overallDiff))}`}
                accent="#FF9933" delay={0.37} icon="🏦"
              />
            </div>

            {/* Records table */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.44 }}
              style={{
                background: "rgba(255,255,255,0.038)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, overflow: "hidden", position: "relative", zIndex: 1,
              }}
            >
              <div style={{
                padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: "#fff" }}>
                    Filed Tax Returns
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 3 }}>
                    Click any row to view breakdown, edit, or delete
                  </p>
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: "5px 13px", borderRadius: 20,
                  background: "rgba(255,102,0,0.13)", color: "#FF9933",
                  border: "1px solid rgba(255,102,0,0.24)", letterSpacing: "0.08em",
                }}>
                  {totalRecords} RECORDS
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.025)" }}>
                      {["Asmt. Year", "Total Income", "Taxable Income", "Tax Calc.", "Balance", "Status", "Filed On"].map((h) => (
                        <th key={h} style={{
                          padding: "11px 18px", textAlign: "left",
                          fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.28)",
                          letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => {
                      const diff = r.taxPaid - r.taxCalculated;
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 * i + 0.52 }}
                          onClick={() => setSelectedRecord(r)}
                          whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                          style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <td style={{ padding: "15px 18px", fontWeight: 800, color: "#fff", fontSize: 13.5, whiteSpace: "nowrap" }}>
                            AY {r.financialYear}
                          </td>
                          <td style={{ padding: "15px 18px", color: "rgba(255,255,255,0.58)", fontSize: 13 }}>₹{fmtShort(r.totalIncome)}</td>
                          <td style={{ padding: "15px 18px", color: "rgba(255,255,255,0.58)", fontSize: 13 }}>₹{fmtShort(r.taxableIncome)}</td>
                          <td style={{ padding: "15px 18px", color: "rgba(255,255,255,0.58)", fontSize: 13 }}>₹{fmtShort(r.taxCalculated)}</td>
                          <td style={{ padding: "15px 18px" }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 800, padding: "4px 11px", borderRadius: 20,
                              background: diff > 0 ? "rgba(34,197,94,0.14)" : diff < 0 ? "rgba(239,68,68,0.14)" : "rgba(96,165,250,0.14)",
                              color: diff > 0 ? "#4ade80" : diff < 0 ? "#f87171" : "#60a5fa",
                              border: `1px solid ${diff > 0 ? "rgba(34,197,94,0.28)" : diff < 0 ? "rgba(239,68,68,0.28)" : "rgba(96,165,250,0.28)"}`,
                              whiteSpace: "nowrap",
                            }}>
                              {diff > 0 ? `↑ ₹${fmtShort(diff)}` : diff < 0 ? `↓ ₹${fmtShort(Math.abs(diff))}` : "Settled"}
                            </span>
                          </td>
                          <td style={{ padding: "15px 18px" }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 800, padding: "4px 11px", borderRadius: 20,
                              background: r.status === "VALID" ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
                              color: r.status === "VALID" ? "#4ade80" : "#f87171",
                              border: `1px solid ${r.status === "VALID" ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.28)"}`,
                            }}>{r.status}</span>
                          </td>
                          <td style={{ padding: "15px 18px", color: "rgba(255,255,255,0.28)", fontSize: 11.5, whiteSpace: "nowrap" }}>
                            {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
              style={{
                marginTop: 20, padding: "14px 20px", borderRadius: 10,
                background: "rgba(255,153,51,0.07)", border: "1px solid rgba(255,153,51,0.17)",
                display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1,
              }}
            >
              <span style={{ fontSize: 16 }}>ℹ️</span>
              <p style={{ fontSize: 12.5, color: "rgba(255,204,128,0.75)", fontWeight: 500, lineHeight: 1.55 }}>
                <strong style={{ color: "#FF9933" }}>Important:</strong> The due date for filing Income Tax Returns for AY 2025–26 is{" "}
                <strong style={{ color: "#FF9933" }}>31 July 2025</strong>. Late filing u/s 234F attracts a penalty of up to ₹5,000.
              </p>
            </motion.div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedRecord && (
          <RecordDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />
        )}
      </AnimatePresence>
    </>
  );
}