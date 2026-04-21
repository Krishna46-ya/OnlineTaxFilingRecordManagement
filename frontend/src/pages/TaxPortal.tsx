import { useState, useEffect } from "react";
import { redirect, useNavigate } from "react-router-dom";

const NAVY = "#1B3A6B";
const SAFFRON = "#FF7B00";
const GREEN = "#006B3C";
const LIGHT = "#F4F7FB";

const AshokaChakra = ({
  size = 200,
  color = NAVY,
  spin = false,
}: {
  size?: number;
  color?: string;
  spin?: boolean;
}) => {
  const spokes = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i * 15 - 90) * (Math.PI / 180);
    return {
      x: 50 + 42 * Math.cos(angle),
      y: 50 + 42 * Math.sin(angle),
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={spin ? { animation: "chakraSpin 50s linear infinite" } : {}}
    >
      <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="1.8" opacity="0.6" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="0.4" opacity="0.3" />
      <circle cx="50" cy="50" r="5.5" fill={color} opacity="0.85" />
      {spokes.map((pt, i) => (
        <line key={i} x1="50" y1="50" x2={pt.x} y2={pt.y} stroke={color} strokeWidth="1.1" opacity="0.75" />
      ))}
      {spokes.map((pt, i) => (
        <circle key={`d${i}`} cx={pt.x} cy={pt.y} r="1.8" fill={color} opacity="0.85" />
      ))}
    </svg>
  );
};

const services = [
  { icon: "📄", title: "File Income Tax Returns", desc: "File ITR-1, ITR-2, ITR-3 and more with pre-filled data from Form 16 and AIS.", tag: "Most Used", tagColor: GREEN },
  { icon: "🔍", title: "Track Refund Status", desc: "Check real-time processing status of your refund, directly linked to your bank account.", tag: null, tagColor: "" },
  { icon: "📊", title: "View Form 26AS & AIS", desc: "Access your Annual Information Statement and Tax Credit Statement anytime, securely.", tag: null, tagColor: "" },
  { icon: "🏢", title: "TDS / TCS Compliance", desc: "Deductors can file TDS returns, download certificates, and make online tax payments.", tag: null, tagColor: "" },
  { icon: "📋", title: "Download Tax Forms", desc: "Download ITR forms, acknowledgements, and all tax documents in a single click.", tag: null, tagColor: "" },
  { icon: "💬", title: "Grievance & Support", desc: "Raise and track grievances. Get expert assistance via live chat and call centre.", tag: "New", tagColor: SAFFRON },
];

const stats = [
  { value: "₹8.2L Cr", label: "Taxes Collected" },
  { value: "7.4 Cr+", label: "Returns Filed" },
  { value: "3.2 Cr+", label: "Registered Users" },
  { value: "99.9%", label: "Platform Uptime" },
];

export default function TaxPortal() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate()

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      @keyframes chakraSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(36px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
      @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(255,123,0,0.35); } 70% { box-shadow: 0 0 0 18px rgba(255,123,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,123,0,0); } }
      @keyframes slideRight { from { transform: translateX(-100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
      @keyframes countUp { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
      @keyframes shimmer { 0% { background-position: -400% center; } 100% { background-position: 400% center; } }

      .hero-text { opacity: 0; animation: fadeUp 0.85s cubic-bezier(0.22,1,0.36,1) forwards; }
      .d1 { animation-delay: 0.05s; }
      .d2 { animation-delay: 0.2s; }
      .d3 { animation-delay: 0.35s; }
      .d4 { animation-delay: 0.5s; }
      .d5 { animation-delay: 0.65s; }
      .d6 { animation-delay: 0.8s; }

      .hero-visual { opacity: 0; animation: fadeIn 1.2s ease 0.4s forwards; }
      .float-anim { animation: float 5s ease-in-out 1.2s infinite; }

      .svc-card {
        transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, border-color 0.3s ease;
        cursor: pointer;
      }
      .svc-card:hover {
        transform: translateY(-8px) scale(1.01);
        box-shadow: 0 28px 56px rgba(27,58,107,0.14) !important;
        border-color: ${SAFFRON} !important;
      }
      .svc-card:hover .card-arrow { color: ${SAFFRON}; transform: translateX(4px); }
      .card-arrow { transition: transform 0.25s ease, color 0.25s ease; color: #8B97B5; }

      .btn-saffron { transition: transform 0.22s ease, box-shadow 0.22s ease; }
      .btn-saffron:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(255,123,0,0.5) !important; }
      .btn-outline { transition: transform 0.22s ease, background 0.22s ease, color 0.22s ease; }
      .btn-outline:hover { transform: translateY(-3px); background: rgba(255,255,255,0.1) !important; }

      .nav-link { transition: color 0.2s; cursor: pointer; position: relative; }
      .nav-link::after { content: ''; position: absolute; bottom: -6px; left: 0; width: 0; height: 2px; background: ${SAFFRON}; transition: width 0.28s ease; border-radius: 2px; }
      .nav-link:hover { color: ${SAFFRON} !important; }
      .nav-link:hover::after { width: 100%; }

      .stat-item { opacity: 0; animation: countUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
      .stat-item:nth-child(1) { animation-delay: 0.1s; }
      .stat-item:nth-child(2) { animation-delay: 0.25s; }
      .stat-item:nth-child(3) { animation-delay: 0.4s; }
      .stat-item:nth-child(4) { animation-delay: 0.55s; }

      .svc-card { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
      .svc-card:nth-child(1) { animation-delay: 0.1s; }
      .svc-card:nth-child(2) { animation-delay: 0.2s; }
      .svc-card:nth-child(3) { animation-delay: 0.3s; }
      .svc-card:nth-child(4) { animation-delay: 0.4s; }
      .svc-card:nth-child(5) { animation-delay: 0.5s; }
      .svc-card:nth-child(6) { animation-delay: 0.6s; }

      .cta-section { opacity: 0; animation: fadeUp 0.85s cubic-bezier(0.22,1,0.36,1) 0.2s forwards; }

      .pulse-badge { animation: pulseRing 2.5s ease-in-out infinite; }
      .shimmer-text {
        background: linear-gradient(90deg, #fff 30%, #FFD4A0 50%, #fff 70%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 3s linear infinite;
      }

      .footer-link { transition: color 0.2s; cursor: pointer; }
      .footer-link:hover { color: #FFFFFF !important; }

      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-track { background: #0A1628; }
      ::-webkit-scrollbar-thumb { background: ${NAVY}; border-radius: 4px; }

      button { font-family: 'DM Sans', sans-serif; }
    `;
    document.head.appendChild(style);

    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: LIGHT, color: "#0D1B3E", overflowX: "hidden", minHeight: "100vh" }}>

      {/* TRICOLOR TOP STRIPE */}
      <div style={{ display: "flex", height: 5 }}>
        <div style={{ flex: 1, background: SAFFRON }} />
        <div style={{ flex: 1, background: "#FFFFFF" }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* ───── NAVBAR ───── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: navScrolled ? "rgba(255,255,255,0.97)" : "#FFFFFF",
        backdropFilter: "blur(12px)",
        boxShadow: navScrolled ? "0 2px 30px rgba(27,58,107,0.10)" : "0 1px 0 #E4E9F2",
        transition: "box-shadow 0.3s ease, background 0.3s ease",
      }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <AshokaChakra size={38} color={NAVY} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, lineHeight: 1.2, fontFamily: "'Crimson Pro', serif", letterSpacing: "-0.01em" }}>
                Income Tax e-Filing Portal
              </div>
              <div style={{ fontSize: 10, color: "#8B97B5", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 1 }}>
                Ministry of Finance · Government of India
              </div>
            </div>
          </div>

          {/* Nav Links – hidden on small screens in this demo */}
          <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
            {["Services", "Help & FAQs", "About"].map((label) => (
              <span key={label} className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: "#2D3A5A" }}>
                {label}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn-outline" style={{
              padding: "9px 22px", borderRadius: 7,
              border: `2px solid ${NAVY}`, background: "transparent",
              color: NAVY, fontSize: 14, fontWeight: 600, cursor: "pointer",
              letterSpacing: "-0.01em",
            }} onClick={()=>{navigate('/signin')}}>
              Sign In
            </button>
            <button className="btn-saffron pulse-badge" style={{
              padding: "9px 22px", borderRadius: 7, border: "none",
              background: SAFFRON, color: "#FFFFFF",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              letterSpacing: "-0.01em",
            }} onClick={()=>{navigate('/signup')}}>
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section style={{
        background: `linear-gradient(140deg, #0A1628 0%, #1B3A6B 55%, #1E4D8C 100%)`,
        padding: "96px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Large BG chakra */}
        <div style={{ position: "absolute", right: "-4%", top: "-15%", opacity: 0.05, pointerEvents: "none" }}>
          <AshokaChakra size={600} color="#FFFFFF" spin />
        </div>
        {/* Subtle radial glow */}
        <div style={{
          position: "absolute", left: "30%", top: "50%", transform: "translate(-50%,-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,123,0,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>

          {/* Left text column */}
          <div style={{ flex: "1 1 480px" }}>
            {/* AY badge */}
            <div className="hero-text d1" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,123,0,0.14)", border: "1px solid rgba(255,123,0,0.3)",
              borderRadius: 24, padding: "6px 16px", marginBottom: 26,
              fontSize: 11.5, color: "#FFB870", fontWeight: 600, letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: SAFFRON, display: "inline-block", flexShrink: 0 }} />
              Assessment Year 2025–26 · Filing Now Open
            </div>

            <h1 className="hero-text d2" style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: "clamp(38px, 5.5vw, 62px)",
              fontWeight: 800, color: "#FFFFFF",
              lineHeight: 1.12, marginBottom: 22, letterSpacing: "-0.02em",
            }}>
              File Your Taxes<br />
              with <span style={{ color: SAFFRON }}>Confidence.</span>
            </h1>

            <p className="hero-text d3" style={{
              fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.72,
              marginBottom: 38, maxWidth: 510,
            }}>
              India's official income tax e-filing platform — secure, transparent, and built for every citizen. File returns, claim refunds, and stay compliant, all in one place.
            </p>

            {/* Primary CTAs */}
            <div className="hero-text d4" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 44 }}>
              <button className="btn-saffron" style={{
                padding: "15px 34px", borderRadius: 9, border: "none",
                background: SAFFRON, color: "#FFFFFF", fontSize: 15, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 8px 28px rgba(255,123,0,0.42)", letterSpacing: "-0.01em",
              }} onClick={()=>{navigate('/dashboard')}}>
                e-File Your ITR →
              </button>
              <button className="btn-outline" style={{
                padding: "15px 34px", borderRadius: 9,
                border: "2px solid rgba(255,255,255,0.25)", background: "transparent",
                color: "#FFFFFF", fontSize: 15, fontWeight: 600, cursor: "pointer",
                letterSpacing: "-0.01em",
              }} onClick={()=>{navigate('/dashboard')}}>
                Track Refund
              </button>
            </div>

            {/* Stats strip */}
            <div className="hero-text d5" style={{
              borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 28,
              display: "flex", gap: 36, flexWrap: "wrap",
            }}>
              {stats.map((s) => (
                <div key={s.value} className="stat-item">
                  <div style={{
                    fontFamily: "'Crimson Pro', serif", fontSize: 24,
                    fontWeight: 700, color: "#FFFFFF", lineHeight: 1,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <div className="hero-visual float-anim" style={{ flex: "0 0 300px", display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 280, height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,123,0,0.18) 0%, transparent 65%)",
              }} />
              <AshokaChakra size={270} color="#FFFFFF" spin />
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>ITR</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3, letterSpacing: "0.06em" }}>e-Filing</div>
              </div>
            </div>
          </div>
        </div>

        {/* Secure badges */}
        <div className="hero-text d6" style={{ maxWidth: 1240, margin: "36px auto 0", padding: "0 0", display: "flex", gap: 24, flexWrap: "wrap" }}>
          {["🔒 256-bit SSL Encrypted", "✅ ISO 27001 Certified", "🏛️ Government of India Portal", "📱 Available on Mobile"].map((b) => (
            <div key={b} style={{
              fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 6,
            }}>{b}</div>
          ))}
        </div>
      </section>

      {/* TRICOLOR DIVIDER */}
      <div style={{ display: "flex", height: 4 }}>
        <div style={{ flex: 1, background: SAFFRON }} />
        <div style={{ flex: 1, background: "#FFFFFF", borderTop: "1px solid #E4E9F2", borderBottom: "1px solid #E4E9F2" }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* ───── SERVICES ───── */}
      <section style={{ padding: "84px 24px", background: LIGHT }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 11.5, color: SAFFRON, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
              Portal Services
            </div>
            <h2 style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 700,
              color: NAVY, marginBottom: 16, letterSpacing: "-0.02em",
            }}>
              Everything You Need, One Portal
            </h2>
            <p style={{ fontSize: 16, color: "#6B7897", maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
              All tax services available 24 × 7 — from filing returns to resolving grievances
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 22 }}>
            {services.map((s) => (
              <div key={s.title} className="svc-card" style={{
                background: "#FFFFFF", borderRadius: 14, padding: "28px 28px 24px",
                border: "1.5px solid #E4E9F2",
                boxShadow: "0 4px 18px rgba(27,58,107,0.055)",
                position: "relative",
              }}>
                {s.tag && (
                  <div style={{
                    position: "absolute", top: 20, right: 20,
                    background: s.tagColor, color: "#FFFFFF",
                    fontSize: 10, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 20, letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>{s.tag}</div>
                )}
                <div style={{ fontSize: 34, marginBottom: 18 }}>{s.icon}</div>
                <h3 style={{
                  fontSize: 16.5, fontWeight: 700, color: NAVY,
                  marginBottom: 10, lineHeight: 1.35, letterSpacing: "-0.01em",
                }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: "#6B7897", lineHeight: 1.65 }}>{s.desc}</p>
                <div className="card-arrow" style={{ marginTop: 20, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  Explore →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── NOTICE BAR ───── */}
      <div style={{
        background: `linear-gradient(90deg, #0D2B5A, #1B3A6B, #0D2B5A)`,
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        flexWrap: "wrap",
      }}>
        <span style={{ background: SAFFRON, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Important
        </span>
        <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.85)", fontWeight: 400 }}>
          Due date for filing ITR for AY 2025-26 is <strong style={{ color: "#fff" }}>31st July 2025</strong>. File before the deadline to avoid late fees.
        </span>
        <span style={{ fontSize: 13, color: SAFFRON, fontWeight: 600, cursor: "pointer" }}>Know More →</span>
      </div>

      {/* ───── CTA SECTION ───── */}
      <section style={{
        background: `linear-gradient(140deg, #0A1628 0%, #1B3A6B 100%)`,
        padding: "80px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", left: "-5%", top: "-20%", opacity: 0.04, pointerEvents: "none" }}>
          <AshokaChakra size={450} color="#FFFFFF" spin />
        </div>
        <div className="cta-section" style={{ maxWidth: 780, margin: "0 auto", textAlign: "center", position: "relative" }}>
          {/* mini tricolor */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, gap: 2 }}>
            {[SAFFRON, "#FFFFFF", GREEN].map((c, i) => (
              <div key={i} style={{ width: 36, height: 4, background: c, opacity: c === "#FFFFFF" ? 0.5 : 1, borderRadius: 2 }} />
            ))}
          </div>
          <h2 style={{
            fontFamily: "'Crimson Pro', serif",
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700,
            lineHeight: 1.18, marginBottom: 16, letterSpacing: "-0.02em",
          }}
            className="shimmer-text"
          >
            Join Crores of Indians Filing Smarter
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.58)", marginBottom: 36, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 36px" }}>
            Create your free account today and experience a faster, paperless, and transparent way to file your income tax returns.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-saffron" style={{
              padding: "15px 36px", borderRadius: 9, border: "none",
              background: SAFFRON, color: "#FFFFFF", fontSize: 15, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 8px 28px rgba(255,123,0,0.42)", letterSpacing: "-0.01em",
            }} onClick={()=>{navigate('/signup')}}>
              Create Free Account
            </button>
            <button className="btn-outline" style={{
              padding: "15px 32px", borderRadius: 9,
              border: "2px solid rgba(255,255,255,0.22)", background: "transparent",
              color: "#FFFFFF", fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em",
            }} onClick={()=>{navigate("/signin")}}>
              Already Registered? Sign In
            </button>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 20 }}>
            Free to use · No hidden charges · Aadhaar-linked e-Verification
          </p>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer style={{ background: "#080F1E", padding: "48px 24px 20px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 36, marginBottom: 40 }}>
            {/* Brand */}
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <AshokaChakra size={30} color="rgba(255,255,255,0.4)" />
                <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 15, fontFamily: "'Crimson Pro', serif" }}>
                  Income Tax e-Filing Portal
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.7 }}>
                An official website of the Ministry of Finance, Government of India. All rights reserved.
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                {[SAFFRON, "#FFFFFF", GREEN].map((c, i) => (
                  <div key={i} style={{ width: 24, height: 3, background: c, opacity: c === "#FFFFFF" ? 0.3 : 0.7, borderRadius: 2 }} />
                ))}
              </div>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
              {[
                { heading: "Quick Links", links: ["e-File ITR", "Track Refund", "Tax Calculator", "View Form 26AS", "TDS / TCS"] },
                { heading: "Help", links: ["FAQs", "Contact Us", "Raise Grievance", "Downloads", "e-Campaign"] },
                { heading: "Legal", links: ["Privacy Policy", "Disclaimer", "Terms of Use", "Accessibility"] },
              ].map((col) => (
                <div key={col.heading}>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 11, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                    {col.heading}
                  </div>
                  {col.links.map((link) => (
                    <div key={link} className="footer-link" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 9 }}>
                      {link}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 18,
            display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
            fontSize: 11.5, color: "rgba(255,255,255,0.25)",
          }}>
            <span>Best viewed in Chrome 80+, Firefox 70+, Edge 80+ · Screen resolution 1024×768+</span>
            <span>Version 3.2.1 &nbsp;|&nbsp; Last Updated: April 2025 &nbsp;|&nbsp; © {new Date().getFullYear()} Ministry of Finance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
