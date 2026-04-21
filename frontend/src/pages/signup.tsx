"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ─── Theme ────────────────────────────────────────────────────────────────────
const NAVY    = "#1B3A6B";
const SAFFRON = "#FF7B00";
const GREEN   = "#006B3C";
const LIGHT   = "#F4F7FB";
const ERROR   = "#D9363E";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  name:     string;
  panId:    string;
  email:    string;
  DOB:      string;
  password: string;
}

interface ZodIssue {
  path:    (string | number)[];
  message: string;
  code?:   string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;
type FormStatus  = "idle" | "loading" | "success" | "error";

// ─── Field config ─────────────────────────────────────────────────────────────
const FIELDS: Array<{
  key:         keyof FormData;
  label:       string;
  type:        string;
  placeholder: string;
  hint?:       string;
  maxLength?:  number;
}> = [
  {
    key:         "name",
    label:       "Full Name",
    type:        "text",
    placeholder: "As per PAN Card",
  },
  {
    key:         "panId",
    label:       "PAN Number",
    type:        "text",
    placeholder: "ABCDE1234F",
    hint:        "10-character Permanent Account Number",
    maxLength:   10,
  },
  {
    key:         "email",
    label:       "Email Address",
    type:        "email",
    placeholder: "you@example.com",
  },
  {
    key:         "DOB",
    label:       "Date of Birth",
    type:        "date",
    placeholder: "",
  },
  {
    key:         "password",
    label:       "Password",
    type:        "password",
    placeholder: "Min. 8 characters",
  },
];

const INITIAL_FORM: FormData = {
  name:     "",
  panId:    "",
  email:    "",
  DOB:      "",
  password: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapZodErrors(issues: ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as keyof FormData | undefined;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

// ─── Ashoka Chakra SVG ───────────────────────────────────────────────────────
function AshokaChakra({
  size  = 200,
  color = "#FFFFFF",
  spin  = false,
}: {
  size?:  number;
  color?: string;
  spin?:  boolean;
}) {
  const spokes = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i * 15 - 90) * (Math.PI / 180);
    return { x: 50 + 42 * Math.cos(angle), y: 50 + 42 * Math.sin(angle) };
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
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
        <circle key={`d${i}`} cx={pt.x} cy={pt.y} r="1.8"
          fill={color} opacity="0.85" />
      ))}
    </motion.svg>
  );
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const errorVariants: Variants = {
  hidden: { opacity: 0, y: -6, height: 0 },
  show:   { opacity: 1, y: 0,  height: "auto", transition: { duration: 0.28, ease: "easeOut" } },
  exit:   { opacity: 0, y: -4, height: 0,       transition: { duration: 0.2 } },
};

const panelLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const panelRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const shakeVariants: Variants = {
  shake: {
    x: [-10, 10, -8, 8, -5, 5, 0],
    transition: { duration: 0.45 },
  },
};

// ─── Eye icon ─────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

// ─── CheckCircle icon ─────────────────────────────────────────────────────────
const CheckCircleIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <motion.svg
    width="20" height="20" viewBox="0 0 24 24"
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    style={{ display: "inline-block" }}
  >
    <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
    <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
  </motion.svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Signup() {
  const [form,         setForm        ] = useState<FormData>(INITIAL_FORM);
  const [fieldErrors,  setFieldErrors ] = useState<FieldErrors>({});
  const [globalError,  setGlobalError ] = useState<string | null>(null);
  const [status,       setStatus      ] = useState<FormStatus>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof FormData | null>(null);
  const [shaking,      setShaking     ] = useState(false);
  const navigate = useNavigate();

  // Inject fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'DM Sans', sans-serif; background: ${LIGHT}; }

      input[type="date"]::-webkit-calendar-picker-indicator {
        opacity: 0.5; cursor: pointer;
      }
      input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 40px #fff inset !important;
        -webkit-text-fill-color: #0D1B3E !important;
      }
      input::placeholder { color: #BBBFCC; font-size: 13.5px; }

      .field-input {
        width: 100%; padding: 12px 14px; font-size: 14px;
        font-family: 'DM Sans', sans-serif; font-weight: 400;
        border-radius: 8px; outline: none; background: #fff;
        transition: border-color 0.22s ease, box-shadow 0.22s ease;
        color: #0D1B3E; appearance: none;
      }
      .field-input:focus {
        box-shadow: 0 0 0 3px rgba(27,58,107,0.12);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = useCallback((key: keyof FormData, value: string) => {
    const processed = key === "panId" ? value.toUpperCase().slice(0, 10) : value;
    setForm(prev => ({ ...prev, [key]: processed }));
    setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    setGlobalError(null);
  }, []);

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
      const res = await fetch("http://localhost:3000/auth/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // ── Zod field-level validation errors ──
        if (res.status === 400 && Array.isArray(data.errors)) {
          const mapped = mapZodErrors(data.errors as ZodIssue[]);
          setFieldErrors(mapped);
          setStatus("error");
          triggerShake();
          return;
        }

        // ── Other server errors (401, 409, 500 …) ──
        setGlobalError(
          typeof data.message === "string"
            ? data.message
            : "Something went wrong. Please try again."
        );
        setStatus("error");
        triggerShake();
        return;
      }

      // ── Success ──
      setStatus("success");
    } catch {
      setGlobalError("Network error. Please check your connection and try again.");
      setStatus("error");
      triggerShake();
    }
  };

  // ─── Success screen ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div style={{ minHeight: "100vh", background: LIGHT, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "#fff", borderRadius: 20, padding: "56px 48px",
            maxWidth: 440, width: "100%", textAlign: "center",
            boxShadow: "0 24px 64px rgba(27,58,107,0.1)",
            border: "1.5px solid #E4E9F2",
          }}
        >
          {/* Tricolor */}
          <div style={{ display: "flex", height: 4, borderRadius: 4, overflow: "hidden", marginBottom: 36 }}>
            <div style={{ flex: 1, background: SAFFRON }} />
            <div style={{ flex: 1, background: "#E4E9F2" }} />
            <div style={{ flex: 1, background: GREEN }} />
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
          >
            <CheckCircleIcon />
          </motion.div>

          <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
            Registration Successful
          </h2>
          <p style={{ fontSize: 14.5, color: "#6B7897", lineHeight: 1.65, marginBottom: 32 }}>
            Your account has been created. You can now sign in to the Income Tax e-Filing portal using your PAN Number and password.
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setStatus("idle"); navigate('/signin') }}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 9, border: "none",
              background: NAVY, color: "#fff", fontSize: 14.5, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Go to Sign In →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── Main form ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: LIGHT,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'DM Sans', sans-serif",
    }}>
      <motion.div
        initial="hidden"
        animate="show"
        style={{
          display: "flex", width: "100%", maxWidth: 960,
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 32px 80px rgba(27,58,107,0.14)",
          minHeight: 620,
        }}
      >

        {/* ── Left Brand Panel ─────────────────────────────────────────────── */}
        <motion.div
          variants={panelLeft}
          style={{
            flex: "0 0 38%",
            background: `linear-gradient(155deg, #0A1628 0%, ${NAVY} 55%, #1E4D8C 100%)`,
            padding: "40px 36px",
            display: "flex", flexDirection: "column",
            alignItems: "flex-start", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Tricolor stripe */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", height: 4 }}>
            <div style={{ flex: 1, background: SAFFRON }} />
            <div style={{ flex: 1, background: "#FFFFFF", opacity: 0.5 }} />
            <div style={{ flex: 1, background: GREEN }} />
          </div>

          {/* BG chakra */}
          <div style={{ position: "absolute", bottom: "-15%", right: "-20%", opacity: 0.06, pointerEvents: "none" }}>
            <AshokaChakra size={380} color="#FFFFFF" spin />
          </div>

          {/* Logo */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <AshokaChakra size={40} color="rgba(255,255,255,0.7)" />
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Government of India
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, letterSpacing: "0.04em" }}>
              Ministry of Finance
            </div>
          </div>

          {/* Center text */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
              {[SAFFRON, "rgba(255,255,255,0.4)", GREEN].map((c, i) => (
                <div key={i} style={{ width: 28, height: 3, background: c, borderRadius: 2 }} />
              ))}
            </div>
            <h1 style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 28, fontWeight: 800, color: "#FFFFFF",
              lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 14,
            }}>
              Join the Income Tax e-Filing Portal
            </h1>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.52)", lineHeight: 1.7 }}>
              Securely file returns, claim refunds, and manage your tax compliance — all in one official platform.
            </p>
          </div>

          {/* Bottom badge row */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {["🔒 256-bit SSL Encrypted", "✅ ISO 27001 Certified", "🏛️ Official Gov Portal"].map(b => (
              <div key={b} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{b}</div>
            ))}
          </div>
        </motion.div>

        {/* ── Right Form Panel ──────────────────────────────────────────────── */}
        <motion.div
          variants={panelRight}
          style={{
            flex: 1, background: "#FFFFFF",
            padding: "44px 44px 36px",
            display: "flex", flexDirection: "column", overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 26, fontWeight: 700, color: NAVY,
              letterSpacing: "-0.02em", marginBottom: 6,
            }}>
              Create your account
            </h2>
            <p style={{ fontSize: 13.5, color: "#8B97B5" }}>
              Already registered?{" "}
              <span onClick={()=>{navigate('/signin')}} style={{ color: SAFFRON, fontWeight: 600, cursor: "pointer" }}>Sign In →</span>
            </p>
          </div>

          {/* Global error banner */}
          <AnimatePresence>
            {globalError && (
              <motion.div
                key="global-error"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{   opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.28 }}
                style={{
                  background: "rgba(217,54,62,0.07)",
                  border: "1px solid rgba(217,54,62,0.25)",
                  borderRadius: 8, padding: "12px 16px",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
                <span style={{ fontSize: 13.5, color: ERROR, lineHeight: 1.5 }}>{globalError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fields */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}
          >
            {FIELDS.map(({ key, label, type, placeholder, hint, maxLength }) => {
              const hasError    = Boolean(fieldErrors[key]);
              const isFocused   = focusedField === key;
              const isPassword  = key === "password";

              const borderColor = hasError
                ? ERROR
                : isFocused
                ? NAVY
                : "#DDE2EE";

              return (
                <motion.div key={key} variants={fieldVariants}>
                  {/* Label */}
                  <label style={{
                    display: "block", fontSize: 13, fontWeight: 600,
                    color: hasError ? ERROR : NAVY,
                    marginBottom: 7, letterSpacing: "0.01em",
                    transition: "color 0.2s",
                  }}>
                    {label}
                    {key === "panId" && (
                      <span style={{ fontWeight: 400, color: "#A0AAC0", marginLeft: 6 }}>
                        (e.g. ABCDE1234F)
                      </span>
                    )}
                  </label>

                  {/* Input wrapper */}
                  <motion.div
                    animate={shaking && hasError ? "shake" : ""}
                    variants={shakeVariants}
                    style={{ position: "relative" }}
                  >
                    <input
                      className="field-input"
                      type={isPassword && showPassword ? "text" : type}
                      placeholder={placeholder}
                      value={form[key]}
                      maxLength={maxLength}
                      onChange={e => handleChange(key, e.target.value)}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        border: `1.5px solid ${borderColor}`,
                        paddingRight: isPassword ? 44 : 14,
                      }}
                    />

                    {/* Show/hide password toggle */}
                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        style={{
                          position: "absolute", right: 12, top: "50%",
                          transform: "translateY(-50%)", background: "none",
                          border: "none", cursor: "pointer",
                          color: "#8B97B5", padding: 2,
                          display: "flex", alignItems: "center",
                          transition: "color 0.2s",
                        }}
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    )}
                  </motion.div>

                  {/* Hint text */}
                  {hint && !hasError && (
                    <div style={{ fontSize: 11.5, color: "#A0AAC0", marginTop: 5 }}>{hint}</div>
                  )}

                  {/* Field error */}
                  <AnimatePresence>
                    {hasError && (
                      <motion.div
                        key={`err-${key}`}
                        variants={errorVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        style={{
                          overflow: "hidden",
                          display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6,
                        }}
                      >
                        <span style={{ fontSize: 13, color: ERROR, fontWeight: 400, lineHeight: 1.4 }}>
                          ✕ {fieldErrors[key]}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Submit Button */}
            <motion.div variants={fieldVariants} style={{ marginTop: 6 }}>
              <motion.button
                whileHover={status !== "loading" ? { scale: 1.015, boxShadow: "0 12px 30px rgba(255,123,0,0.45)" } : {}}
                whileTap={status !== "loading"   ? { scale: 0.98  } : {}}
                onClick={handleSubmit}
                disabled={status === "loading"}
                style={{
                  width: "100%", padding: "14px 0",
                  borderRadius: 9, border: "none",
                  background: status === "loading"
                    ? `rgba(27,58,107,0.7)`
                    : SAFFRON,
                  color: "#FFFFFF", fontSize: 15, fontWeight: 600,
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: status !== "loading" ? "0 6px 20px rgba(255,123,0,0.35)" : "none",
                  transition: "background 0.25s, box-shadow 0.25s",
                  letterSpacing: "-0.01em",
                }}
              >
                {status === "loading" ? (
                  <>
                    <Spinner />
                    <span>Registering…</span>
                  </>
                ) : (
                  "Create Account →"
                )}
              </motion.button>
            </motion.div>

            {/* Footer note */}
            <motion.p
              variants={fieldVariants}
              style={{ fontSize: 11.5, color: "#A0AAC0", textAlign: "center", lineHeight: 1.6, marginTop: 4 }}
            >
              By registering you agree to the{" "}
              <span style={{ color: NAVY, cursor: "pointer", fontWeight: 500 }}>Terms of Use</span>
              {" "}and{" "}
              <span style={{ color: NAVY, cursor: "pointer", fontWeight: 500 }}>Privacy Policy</span>
              {" "}of the Government of India.
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
