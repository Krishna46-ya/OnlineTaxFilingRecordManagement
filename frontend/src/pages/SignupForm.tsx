import { useState, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const API_URL = "https://your-api.com/api/auth/signup";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: { message: string }[];
}

interface PasswordCheck {
  label: string;
  pass: boolean;
}

// ─── Variants ─────────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const errorVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.2 } },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="animate-spin"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const AlertIcon = () => (
  <svg
    className="mt-0.5 flex-shrink-0 text-red-400"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const LogoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={message}
          variants={errorVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="text-xs text-red-400 mt-1.5 flex items-center gap-1"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

interface InputFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}

function InputField({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  rightElement,
}: InputFieldProps) {
  const [focused, setFocused] = useState<boolean>(false);

  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-widest text-slate-400 uppercase"
      >
        {label}
      </label>
      <motion.div
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.15 }}
        className={`relative flex items-center rounded-xl border bg-white/5 transition-colors duration-200 ${error
            ? "border-red-500/60 ring-1 ring-red-500/30"
            : focused
              ? "border-indigo-500/70 ring-1 ring-indigo-500/20"
              : "border-white/10 hover:border-white/20"
          }`}
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none"
        />
        {rightElement && <div className="pr-3 flex-shrink-0">{rightElement}</div>}
      </motion.div>
      <FieldError message={error} />
    </motion.div>
  );
}

const strengthColors: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-emerald-500",
};

const strengthTextColors: Record<number, string> = {
  1: "text-red-500",
  2: "text-orange-400",
  3: "text-yellow-400",
  4: "text-emerald-400",
};

const strengthLabels: Record<number, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

function PasswordStrength({ password }: { password: string }) {
  const checks: PasswordCheck[] = [
    { label: "8+ chars", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Symbol", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.pass).length;

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 space-y-2"
    >
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={`h-1 flex-1 rounded-full origin-left transition-colors duration-300 ${i < score ? (strengthColors[score] ?? "bg-white/10") : "bg-white/10"
              }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2.5 flex-wrap">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-[10px] font-medium transition-colors duration-200 ${c.pass ? "text-emerald-400" : "text-slate-600"
                }`}
            >
              {c.label}
            </span>
          ))}
        </div>
        <span className={`text-[10px] font-semibold ${strengthTextColors[score] ?? "text-slate-600"}`}>
          {strengthLabels[score] ?? ""}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errs: FormErrors = {};

  if (!form.name.trim()) {
    errs.name = "Full name is required";
  } else if (form.name.trim().length < 2) {
    errs.name = "Name must be at least 2 characters";
  }

  if (!form.email.trim()) {
    errs.email = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errs.email = "Enter a valid email address";
  }

  if (!form.password) {
    errs.password = "Password is required";
  } else if (form.password.length < 8) {
    errs.password = "Password must be at least 8 characters";
  } else if (!/[A-Z]/.test(form.password)) {
    errs.password = "Include at least one uppercase letter";
  } else if (!/\d/.test(form.password)) {
    errs.password = "Include at least one number";
  }

  return errs;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignupForm() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleChange =
    (field: keyof FormState) =>
      (e: ChangeEvent<HTMLInputElement>): void => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
        if (apiError) setApiError("");
      };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data: ApiErrorResponse = await res.json();

      if (!res.ok) {
        const msg =
          data?.message ??
          data?.error ??
          (Array.isArray(data?.errors) ? data.errors?.[0]?.message : undefined) ??
          `Something went wrong (${res.status})`;
        setApiError(msg);
        return;
      }

      setSuccess(true);
    } catch {
      setApiError("Unable to connect. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center p-4 font-sans">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-violet-600/8 blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative text-center space-y-5 max-w-sm w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              className="mx-auto w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-emerald-400 scale-150"
              >
                <CheckIcon />
              </motion.div>
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">You're in!</h2>
              <p className="text-slate-400 text-sm mt-2">
                Welcome,{" "}
                <span className="text-white font-medium">
                  {form.name.split(" ")[0]}
                </span>
                . Check your email to verify your account.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-md"
          >
            {/* Card */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-8 space-y-6 shadow-2xl shadow-black/40">
              {/* Header */}
              <motion.div variants={itemVariants} className="space-y-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center mb-4">
                  <LogoIcon />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Create your account
                </h1>
                <p className="text-slate-500 text-sm">
                  Start building something great today.
                </p>
              </motion.div>

              {/* API Error */}
              <AnimatePresence>
                {apiError && (
                  <motion.div
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3"
                  >
                    <AlertIcon />
                    <p className="text-sm text-red-300 leading-snug">{apiError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <InputField
                  label="Full name"
                  id="name"
                  value={form.name}
                  onChange={handleChange("name")}
                  error={errors.name}
                  placeholder="Jane Smith"
                  autoComplete="name"
                />

                <InputField
                  label="Email"
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  error={errors.email}
                  placeholder="jane@company.com"
                  autoComplete="email"
                />

                {/* Password field — custom to include strength meter */}
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold tracking-widest text-slate-400 uppercase"
                  >
                    Password
                  </label>
                  <div
                    className={`relative flex items-center rounded-xl border bg-white/5 transition-colors duration-200 ${errors.password
                        ? "border-red-500/60 ring-1 ring-red-500/30"
                        : "border-white/10 hover:border-white/20 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/20"
                      }`}
                  >
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange("password")}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className="w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="pr-3.5 text-slate-500 hover:text-slate-300 transition-colors duration-150 flex-shrink-0"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                  <FieldError message={errors.password} />
                  <AnimatePresence>
                    {form.password && <PasswordStrength password={form.password} />}
                  </AnimatePresence>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-1">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.015 }}
                    whileTap={{ scale: loading ? 1 : 0.985 }}
                    className="relative w-full overflow-hidden rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-colors duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <SpinnerIcon />
                          Creating account…
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Create account
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </form>

              <motion.p
                variants={itemVariants}
                className="text-center text-xs text-slate-600"
              >
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors duration-150 font-medium"
                >
                  Sign in
                </a>
              </motion.p>
            </div>

            {/* Terms */}
            <motion.p
              variants={itemVariants}
              className="text-center text-[11px] text-slate-700 mt-4"
            >
              By creating an account you agree to our{" "}
              <a
                href="/terms"
                className="underline underline-offset-2 hover:text-slate-500 transition-colors"
              >
                Terms
              </a>{" "}
              &amp;{" "}
              <a
                href="/privacy"
                className="underline underline-offset-2 hover:text-slate-500 transition-colors"
              >
                Privacy Policy
              </a>
              .
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
