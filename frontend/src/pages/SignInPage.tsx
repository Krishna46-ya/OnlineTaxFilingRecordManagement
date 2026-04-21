"use client";

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";

// ─── Theme ────────────────────────────────────────────────────────────────────
const NAVY    = "#1B3A6B";
const SAFFRON = "#FF7B00";
const GREEN   = "#006B3C";
const LIGHT   = "#F4F7FB";
const ERROR   = "#D9363E";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  panId:    string;
  password: string;
}

interface ZodIssue {
  path:    (string | number)[];
  message: string;
  code?:   string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;
type FormStatus  = "idle" | "loading" | "success" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapZodErrors(issues: ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as keyof FormData | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

const INITIAL_FORM: FormData = { panId: "", password: "" };

// ─── Ashoka Chakra ────────────────────────────────────────────────────────────
function AshokaChakra({
  size  = 200,
  color = "#FFFFFF",
  spin  = false,
  opacity = 1,
}: {
  size?:    number;
  color?:   string;
  spin?:    boolean;
  opacity?: number;
}) {
  const spokes = Array.from({ length: 24 }).map((_, i) => {
    const a = (i * 15 - 90) * (Math.PI / 180);
    return { x: 50 + 42 * Math.cos(a), y: 50 + 42 * Math.sin(a) };
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ opacity }}
      animate={spin ? { rotate: 360 } : {}}
      transition={spin ? { duration: 60, repeat: Infinity, ease: "linear" } : {}}
    >
      <circle cx="50" cy="50" r="48"  fill="none" stroke={color} strokeWidth="1.8" opacity="0.55" />
      <circle cx="50" cy="50" r="40"  fill="none" stroke={color} strokeWidth="0.4" opacity="0.25" />
      <circle cx="50" cy="50" r="5.5" fill={color} opacity="0.85" />
      {spokes.map((pt, i) => (
        <line key={i} x1="50" y1="50" x2={pt.x} y2={pt.y}
          stroke={color} strokeWidth="1.1" opacity="0.72" />
      ))}
      {spokes.map((pt, i) => (
        <circle key={`d${i}`} cx={pt.x} cy={pt.y} r="1.8" fill={color} opacity="0.85" />
      ))}
    </motion.svg>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const containerVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const errorVariants: Variants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  show:   { opacity: 1, height: "auto", marginTop: 6,
            transition: { duration: 0.28, ease: "easeOut" } },
  exit:   { opacity: 0, height: 0, marginTop: 0,
            transition: { duration: 0.2 } },
};

const shakeVariants: Variants = {
  shake: {
    x: [-10, 10, -8, 8, -5, 5, 0],
    transition: { duration: 0.45 },
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IdCardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const Spinner = () => (
  <motion.svg width="19" height="19" viewBox="0 0 24 24"
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    style={{ display: "inline-block", flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
    <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
  </motion.svg>
);

// ─── Field configs ────────────────────────────────────────────────────────────
type FieldConfig = {
  key:         keyof FormData;
  label:       string;
  type:        string;
  placeholder: string;
  hint?:       string;
  maxLength?:  number;
  icon:        React.ReactNode;
};

const FIELDS: FieldConfig[] = [
  {
    key:         "panId",
    label:       "PAN Number",
    type:        "text",
    placeholder: "ABCDE1234F",
    hint:        "Enter your 10-character Permanent Account Number",
    maxLength:   10,
    icon:        <IdCardIcon />,
  },
  {
    key:         "password",
    label:       "Password",
    type:        "password",
    placeholder: "Enter your password",
    icon:        <LockIcon />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SignInPage() {
  const navigate = useNavigate();

  const [form,         setForm        ] = useState<FormData>(INITIAL_FORM);
  const [fieldErrors,  setFieldErrors ] = useState<FieldErrors>({});
  const [globalError,  setGlobalError ] = useState<string | null>(null);
  const [status,       setStatus      ] = useState<FormStatus>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof FormData | null>(null);
  const [shaking,      setShaking     ] = useState(false);

  // Inject fonts + global styles
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'DM Sans', sans-serif; background: ${LIGHT}; }

      .field-input {
        width: 100%; padding: 11px 14px 11px 42px;
        font-size: 14px; font-family: 'DM Sans', sans-serif;
        font-weight: 400; border-radius: 9px; outline: none;
        background: #FAFBFD; transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        color: #0D1B3E;
      }
      .field-input:focus { background: #fff; }
      .field-input::placeholder { color: #BCC3D4; font-size: 13.5px; }
      input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 40px #FAFBFD inset !important;
        -webkit-text-fill-color: #0D1B3E !important;
      }
      input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.45; cursor: pointer; }
      button { font-family: 'DM Sans', sans-serif; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = useCallback((key: keyof FormData, value: string) => {
    const processed = key === "panId" ? value.toUpperCase().slice(0, 10) : value;
    setForm(prev => ({ ...prev, [key]: processed }));
    setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    setGlobalError(null);
    if (status === "error") setStatus("idle");
  }, [status]);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSubmit = async () => {
    if (status === "loading") return;

    setStatus("loading");
    setFieldErrors({});
    setGlobalError(null);

    try {
      const res = await fetch("/auth/signin", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",               // send / receive cookies
        body:        JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // ── Zod field-level validation errors ──────────────────────────────
        if (res.status === 400 && Array.isArray(data.errors)) {
          setFieldErrors(mapZodErrors(data.errors as ZodIssue[]));
          setStatus("error");
          triggerShake();
          return;
        }

        // ── Domain errors returned as { msg: "..." } ───────────────────────
        if (data.msg) {
          const friendly: Record<string, string> = {
            "account with panId doesnt exist":
              "No account found for this PAN Number. Please register first.",
            "incorrect passoword":
              "Incorrect password. Please check and try again.",
          };
          setGlobalError(friendly[data.msg] ?? data.msg);
          setStatus("error");
          triggerShake();
          return;
        }

        // ── Fallback server error ──────────────────────────────────────────
        setGlobalError("Something went wrong. Please try again.");
        setStatus("error");
        triggerShake();
        return;
      }

      // ── Success → redirect to dashboard ───────────────────────────────────
      setStatus("success");
      setTimeout(() => navigate("/dashboard"), 600);

    } catch {
      setGlobalError("Network error. Please check your connection and try again.");
      setStatus("error");
      triggerShake();
    }
  };

  // ── Enter key submit ──────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: LIGHT,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── Outer card (form + brand strip) ──────────────────────────────────── */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="show"
        style={{
          width: "100%", maxWidth: 460,
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 32px 80px rgba(27,58,107,0.13)",
          background: "#fff",
        }}
      >

        {/* ── Top brand strip ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          style={{
            background: `linear-gradient(135deg, #0A1628 0%, ${NAVY} 60%, #1E4D8C 100%)`,
            padding: "28px 36px 24px",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Tricolor bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", height: 4 }}>
            <div style={{ flex: 1, background: SAFFRON }} />
            <div style={{ flex: 1, background: "#fff", opacity: 0.4 }} />
            <div style={{ flex: 1, background: GREEN }} />
          </div>

          {/* BG watermark chakra */}
          <div style={{ position: "absolute", right: -60, top: -60, pointerEvents: "none" }}>
            <AshokaChakra size={220} color="#FFFFFF" spin opacity={0.05} />
          </div>

          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <AshokaChakra size={36} color="rgba(255,255,255,0.75)" />
            <div>
              <div style={{
                fontFamily: "'Crimson Pro', serif",
                fontSize: 15, fontWeight: 700, color: "#FFFFFF",
                lineHeight: 1.2, letterSpacing: "-0.01em",
              }}>
                Income Tax e-Filing Portal
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>
                Ministry of Finance · Government of India
              </div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ marginTop: 22, position: "relative", zIndex: 1 }}>
            <h1 style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 26, fontWeight: 800, color: "#FFFFFF",
              letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 6,
            }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.48)", lineHeight: 1.55 }}>
              Sign in with your PAN Number to access your account
            </p>
          </div>
        </motion.div>

        {/* ── Form body ─────────────────────────────────────────────────────── */}
        <div style={{ padding: "32px 36px 30px" }}>

          {/* Global error banner */}
          <AnimatePresence>
            {globalError && (
              <motion.div
                key="g-err"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 22 }}
                exit={{   opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.28 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  background: "rgba(217,54,62,0.07)",
                  border: "1px solid rgba(217,54,62,0.22)",
                  borderRadius: 9, padding: "12px 16px",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: 13.5, color: ERROR, lineHeight: 1.5 }}>
                    {globalError}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fields */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
            onKeyDown={handleKeyDown}
          >
            {FIELDS.map(({ key, label, type, placeholder, hint, maxLength, icon }) => {
              const hasError   = Boolean(fieldErrors[key]);
              const isFocused  = focusedField === key;
              const isPassword = key === "password";

              const borderColor = hasError  ? ERROR
                                : isFocused ? NAVY
                                :             "#DDE2EE";
              const shadowColor = hasError  ? "rgba(217,54,62,0.12)"
                                : isFocused ? "rgba(27,58,107,0.10)"
                                :             "transparent";

              return (
                <motion.div key={key} variants={fieldVariants}>
                  {/* Label */}
                  <label style={{
                    display: "block", fontSize: 12.5, fontWeight: 600,
                    color: hasError ? ERROR : "#2D3A5A",
                    marginBottom: 7, letterSpacing: "0.015em",
                    transition: "color 0.2s",
                  }}>
                    {label}
                  </label>

                  {/* Input + shake wrapper */}
                  <motion.div
                    animate={shaking && hasError ? "shake" : ""}
                    variants={shakeVariants}
                    style={{ position: "relative" }}
                  >
                    {/* Leading icon */}
                    <div style={{
                      position: "absolute", left: 13, top: "50%",
                      transform: "translateY(-50%)", pointerEvents: "none",
                      color: hasError ? ERROR : isFocused ? NAVY : "#A0AAC0",
                      transition: "color 0.22s",
                      display: "flex", alignItems: "center",
                    }}>
                      {icon}
                    </div>

                    <input
                      className="field-input"
                      type={isPassword && showPassword ? "text" : type}
                      placeholder={placeholder}
                      value={form[key]}
                      maxLength={maxLength}
                      autoComplete={isPassword ? "current-password" : "username"}
                      onChange={e => handleChange(key, e.target.value)}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        border: `1.5px solid ${borderColor}`,
                        boxShadow: `0 0 0 3px ${shadowColor}`,
                        paddingRight: isPassword ? 44 : 14,
                      }}
                    />

                    {/* Show/hide toggle */}
                    {isPassword && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(p => !p)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        style={{
                          position: "absolute", right: 12, top: "50%",
                          transform: "translateY(-50%)", background: "none",
                          border: "none", cursor: "pointer",
                          color: "#8B97B5", padding: 2,
                          display: "flex", alignItems: "center",
                          transition: "color 0.2s",
                        }}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    )}
                  </motion.div>

                  {/* Hint */}
                  {hint && !hasError && (
                    <div style={{ fontSize: 11.5, color: "#A8B0C4", marginTop: 5, lineHeight: 1.5 }}>
                      {hint}
                    </div>
                  )}

                  {/* Field error */}
                  <AnimatePresence>
                    {hasError && (
                      <motion.div
                        key={`e-${key}`}
                        variants={errorVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        style={{ overflow: "hidden" }}
                      >
                        <span style={{ fontSize: 13, color: ERROR, lineHeight: 1.45, display: "block" }}>
                          ✕ {fieldErrors[key]}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Forgot password */}
            <motion.div variants={fieldVariants} style={{ textAlign: "right", marginTop: -8 }}>
              <span style={{
                fontSize: 12.5, color: SAFFRON, fontWeight: 600,
                cursor: "pointer", letterSpacing: "-0.01em",
              }}>
                Forgot Password?
              </span>
            </motion.div>

            {/* Submit button */}
            <motion.div variants={fieldVariants}>
              <motion.button
                whileHover={status !== "loading" ? {
                  scale: 1.015,
                  boxShadow: "0 14px 32px rgba(27,58,107,0.35)",
                } : {}}
                whileTap={status !== "loading" ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
                disabled={status === "loading" || status === "success"}
                style={{
                  width: "100%", padding: "13px 0",
                  borderRadius: 9, border: "none",
                  background: status === "success"
                    ? GREEN
                    : status === "loading"
                    ? "rgba(27,58,107,0.7)"
                    : NAVY,
                  color: "#FFFFFF", fontSize: 15, fontWeight: 600,
                  cursor: (status === "loading" || status === "success")
                    ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 10,
                  letterSpacing: "-0.01em",
                  transition: "background 0.3s ease",
                  boxShadow: status === "loading" || status === "success"
                    ? "none"
                    : "0 6px 20px rgba(27,58,107,0.28)",
                }}
              >
                <AnimatePresence mode="wait">
                  {status === "loading" && (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{   opacity: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Spinner />
                      Signing In…
                    </motion.span>
                  )}
                  {status === "success" && (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      ✓ Redirecting to Dashboard…
                    </motion.span>
                  )}
                  {(status === "idle" || status === "error") && (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{   opacity: 0 }}
                    >
                      Sign In →
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            {/* Register link */}
            <motion.p
              variants={fieldVariants}
              style={{
                textAlign: "center", fontSize: 13.5,
                color: "#8B97B5", marginTop: 2,
              }}
            >
              New to the portal?{" "}
              <span
                onClick={() => navigate("/signup")}
                style={{
                  color: SAFFRON, fontWeight: 600,
                  cursor: "pointer", letterSpacing: "-0.01em",
                }}
              >
                Create an account →
              </span>
            </motion.p>
          </motion.div>
        </div>

        {/* ── Bottom footer strip ───────────────────────────────────────────── */}
        <div style={{
          borderTop: "1px solid #EEF0F6",
          padding: "14px 36px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#FAFBFD",
        }}>
          <span style={{ fontSize: 11, color: "#B0BAD0" }}>
            🔒 256-bit SSL · ISO 27001 Certified
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {[SAFFRON, "#DDE2EE", GREEN].map((c, i) => (
              <div key={i} style={{ width: 18, height: 3, background: c, borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
