"use client";

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import type { AnalysisResult, UserAnswers } from "@/lib/types";
import { MOCK_RESULT } from "@/lib/mock-data";

// ============================================================
// THEME SYSTEM
// Dark: Deep navy + warm cream + amber
// Light: Warm parchment + ink + amber
// ============================================================

// Explicit interface so both DARK and LIGHT satisfy the same shape.
// Never hardcode colors — always use t.tokenName via useTheme().
export interface Theme {
  bg: string;
  bgMid: string;
  bgCard: string;
  bgCardHover: string;
  text: string;
  textDim: string;
  muted: string;
  amber: string;
  amberDim: string;
  amberBg: string;
  amberBorder: string;
  sage: string;
  sageBg: string;
  sageBorder: string;
  rose: string;
  roseBg: string;
  roseBorder: string;
  border: string;
  borderHover: string;
  scrollTrack: string;
  scrollThumb: string;
  grad1: string;
  grad2: string;
  btnPrimary: string;
  btnPrimaryText: string;
  inputBg: string;
  footerBorder: string;
  cardShadow: string;
}

const DARK: Theme = {
  bg:             "#0D1B2A",
  bgMid:          "#162436",
  bgCard:         "rgba(245,237,214,0.04)",
  bgCardHover:    "rgba(245,237,214,0.07)",
  text:           "#FDFAF4",
  textDim:        "#C9BFA8",
  muted:          "rgba(245,237,214,0.42)",
  amber:          "#E8A045",
  amberDim:       "#C4823A",
  amberBg:        "rgba(232,160,69,0.08)",
  amberBorder:    "rgba(232,160,69,0.35)",
  sage:           "#7BAE8F",
  sageBg:         "rgba(123,174,143,0.08)",
  sageBorder:     "rgba(123,174,143,0.25)",
  rose:           "#C97B7B",
  roseBg:         "rgba(201,123,123,0.07)",
  roseBorder:     "rgba(201,123,123,0.2)",
  border:         "rgba(245,237,214,0.11)",
  borderHover:    "rgba(232,160,69,0.4)",
  scrollTrack:    "#0D1B2A",
  scrollThumb:    "rgba(232,160,69,0.3)",
  grad1:          "rgba(232,160,69,0.07)",
  grad2:          "rgba(123,174,143,0.05)",
  btnPrimary:     "#E8A045",
  btnPrimaryText: "#0D1B2A",
  inputBg:        "rgba(245,237,214,0.05)",
  footerBorder:   "rgba(245,237,214,0.08)",
  cardShadow:     "0 1px 4px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)",
};

const LIGHT: Theme = {
  bg:             "#FAF6EE",
  bgMid:          "#F2EBD9",
  bgCard:         "rgba(255,255,255,0.7)",
  bgCardHover:    "rgba(255,255,255,0.95)",
  text:           "#1A1208",
  textDim:        "#4A3F2F",
  muted:          "rgba(26,18,8,0.45)",
  amber:          "#B8640A",
  amberDim:       "#8C4C08",
  amberBg:        "rgba(184,100,10,0.08)",
  amberBorder:    "rgba(184,100,10,0.3)",
  sage:           "#3D7A57",
  sageBg:         "rgba(61,122,87,0.08)",
  sageBorder:     "rgba(61,122,87,0.25)",
  rose:           "#9B4040",
  roseBg:         "rgba(155,64,64,0.07)",
  roseBorder:     "rgba(155,64,64,0.2)",
  border:         "rgba(26,18,8,0.1)",
  borderHover:    "rgba(184,100,10,0.35)",
  scrollTrack:    "#FAF6EE",
  scrollThumb:    "rgba(184,100,10,0.25)",
  grad1:          "rgba(184,100,10,0.05)",
  grad2:          "rgba(61,122,87,0.04)",
  btnPrimary:     "#B8640A",
  btnPrimaryText: "#FAF6EE",
  inputBg:        "rgba(255,255,255,0.6)",
  footerBorder:   "rgba(26,18,8,0.08)",
  cardShadow:     "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05)",
};

interface ThemeCtxType {
  t: Theme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxType>({
  t: DARK,
  isDark: true,
  toggle: () => {},
});
const useTheme = () => useContext(ThemeCtx);

// ============================================================
// GLOBAL STYLES (injected dynamically per theme)
// ============================================================
interface GlobalStyleProps {
  t: Theme;
  isDark: boolean;
}

const GlobalStyle = ({ t, isDark }: GlobalStyleProps) => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { transition: background 0.5s ease, color 0.5s ease; }
    body { background: ${t.bg}; font-family: 'DM Sans', sans-serif; }

    ::selection {
      background: ${isDark ? "rgba(232,160,69,0.3)" : "rgba(184,100,10,0.2)"};
      color: ${t.text};
    }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${t.scrollTrack}; }
    ::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 2px; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes float   {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-7px); }
    }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
    @keyframes softPulse { 0%,100%{opacity:0.7} 50%{opacity:0.25} }
    @keyframes breatheText { 0%,100%{opacity:0.45} 50%{opacity:1} }

    textarea::placeholder, input::placeholder { color: ${t.muted}; }
    textarea, input, button { font-family: 'DM Sans', sans-serif; }

    .fade-up { animation: fadeUp 0.6s ease forwards; }

    .card-hover {
      transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    }
    .card-hover:hover { transform: translateY(-1px); }

    .btn-primary {
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    }
    .btn-primary:hover { transform: translateY(-2px); opacity: 0.92; }
    .btn-primary:active { transform: translateY(0); }
  `}</style>
);

// ============================================================
// THEME TOGGLE
// ============================================================
const ThemeToggle = () => {
  const { t, isDark, toggle } = useTheme();
  return (
    <button
      data-testid="theme-toggle"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed", top: 18, right: 18, zIndex: 1000,
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 24, padding: "7px 12px",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
        transition: "all 0.3s ease",
        boxShadow: isDark
          ? "0 2px 12px rgba(0,0,0,0.3)"
          : "0 2px 12px rgba(0,0,0,0.08)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{
        width: 38, height: 20, borderRadius: 10,
        background: isDark ? "rgba(232,160,69,0.25)" : "rgba(184,100,10,0.15)",
        position: "relative",
        border: `1px solid ${t.amberBorder}`,
        transition: "background 0.3s ease",
      }}>
        <div style={{
          position: "absolute", top: 2,
          left: isDark ? 18 : 2,
          width: 14, height: 14, borderRadius: "50%",
          background: t.amber,
          transition: "left 0.3s ease",
          boxShadow: `0 0 8px ${t.amber}`,
        }} />
      </div>
      {isDark ? (
        /* Sun icon — shown in dark mode to indicate "switch to light" */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Moon icon — shown in light mode to indicate "switch to dark" */
        <svg width="14" height="14" viewBox="0 0 24 24" fill={t.amber} stroke="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
};

// ============================================================
// AMBIENT BACKGROUND
// ============================================================
type BgPhase = "neutral" | "breathing" | "plan";

interface AmbientBgProps {
  phase: BgPhase;
}

// SVG noise texture — renders as organic grain at low opacity.
// feTurbulence generates film-grain-like noise; at 3–5% opacity it reads
// as material surface (like paper or darkroom print), not as decoration.
const GRAIN_SVG =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

const AmbientBg = ({ phase }: AmbientBgProps) => {
  const { t, isDark } = useTheme();
  const configs: Record<BgPhase, [string, string]> = {
    neutral:   [t.grad1, t.grad2],
    breathing: [t.sageBg, t.amberBg],
    plan:      [t.amberBg, t.sageBg],
  };
  const [c1, c2] = configs[phase];

  return (
    <>
      {/* Radial gradient layer */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 65% 55% at 15% 25%, ${c1}, transparent),
          radial-gradient(ellipse 55% 65% at 85% 75%, ${c2}, transparent),
          ${t.bg}
        `,
        transition: "background 1.8s ease",
      }} />
      {/* Grain texture overlay — dark: 4% / light: 2% */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: GRAIN_SVG,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
        opacity: isDark ? 0.04 : 0.02,
        mixBlendMode: "overlay",
        transition: "opacity 0.5s ease",
      }} />
    </>
  );
};

// ============================================================
// SCREEN 1 — LANDING
// ============================================================
interface LandingScreenProps {
  onBegin: () => void;
}

const LandingScreen = ({ onBegin }: LandingScreenProps) => {
  const { t } = useTheme();
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  return (
    <div
      data-testid="landing-screen"
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px", position: "relative", zIndex: 1,
      }}
    >
      {visible && (
        <>
          {/* Logo orb */}
          <div style={{ animation: "fadeUp 0.7s ease forwards", marginBottom: 44, textAlign: "center" }}>
            {/* Orb — outer container floats, inner rings animate independently */}
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              border: `1.5px solid ${t.amberBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: `0 0 48px ${t.amberBg}`,
              animation: "float 4s ease-in-out infinite",
              background: t.amberBg,
              transition: "all 0.5s ease",
              position: "relative",
            }}>
              {/* Middle ring — soft pulse */}
              <div style={{
                position: "absolute",
                width: 90, height: 90, borderRadius: "50%",
                border: `1px solid ${t.amberBorder}`,
                animation: "softPulse 3s 0.5s ease-in-out infinite",
                transition: "border-color 0.5s ease",
              }} />
              {/* Inner dot */}
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: t.amber,
                boxShadow: `0 0 18px ${t.amber}`,
                position: "relative", zIndex: 1,
              }} />
            </div>
            <div style={{
              fontSize: 11, letterSpacing: "0.28em",
              color: t.amber, opacity: 0.85,
              textTransform: "uppercase", fontWeight: 500,
              transition: "color 0.5s ease",
            }}>
              Glitched
            </div>
          </div>

          {/* Hero */}
          <div style={{
            maxWidth: 560, textAlign: "center",
            animation: "fadeUp 0.7s 0.12s ease both", marginBottom: 18,
          }}>
            <h1
              data-testid="hero-headline"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(30px, 6vw, 52px)",
                fontWeight: 600, lineHeight: 1.18,
                color: t.text, marginBottom: 14, letterSpacing: "-0.02em",
                transition: "color 0.5s ease",
              }}
            >
              You&apos;ve been{" "}
              <em style={{ color: t.amber, fontStyle: "italic", transition: "color 0.5s ease" }}>
                glitched.
              </em>
              <br />
              Let&apos;s fix that.
            </h1>
          </div>

          {/* Sub */}
          <div style={{
            maxWidth: 420, textAlign: "center",
            animation: "fadeUp 0.7s 0.25s ease both", marginBottom: 44,
          }}>
            <p style={{
              fontSize: 17, lineHeight: 1.75,
              color: t.textDim, fontWeight: 300,
              transition: "color 0.5s ease",
            }}>
              Laid off. Restructured out. Replaced by a system that didn&apos;t
              ask permission. If you&apos;re here, you already know the feeling.
            </p>
            <p style={{
              fontSize: 17, lineHeight: 1.75,
              color: t.text, fontWeight: 400, marginTop: 10,
              transition: "color 0.5s ease",
            }}>
              Three questions. A real plan. No noise.
            </p>
          </div>

          {/* CTA */}
          <div style={{ animation: "fadeUp 0.7s 0.4s ease both" }}>
            <button
              data-testid="begin-btn"
              onClick={onBegin}
              className="btn-primary"
              style={{
                background: t.btnPrimary, border: "none", borderRadius: 8,
                color: t.btnPrimaryText, fontSize: 15, fontWeight: 500,
                padding: "16px 42px", cursor: "pointer", letterSpacing: "0.02em",
                boxShadow: `0 8px 32px ${t.amberBg}`,
                transition: "background 0.4s ease, color 0.4s ease, box-shadow 0.3s ease",
              }}
            >
              Begin your exit protocol
            </button>
            <div style={{
              marginTop: 12, fontSize: 12, color: t.muted,
              textAlign: "center", letterSpacing: "0.04em",
              transition: "color 0.5s ease",
            }}>
              Free · No account · No credit card
            </div>
          </div>

          {/* Whisper */}
          <div style={{
            position: "absolute", bottom: 28,
            fontSize: 12, color: t.muted,
            animation: "fadeIn 1s 1s ease both",
            letterSpacing: "0.05em", transition: "color 0.5s ease",
          }}>
            Built for the glitched. By someone who&apos;s been there.
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// SCREEN 2 — INTAKE
// ============================================================
interface IntakeScreenProps {
  onSubmit: (answers: UserAnswers) => void;
}

interface Question {
  key: keyof UserAnswers;
  eyebrow: string;
  q: string;
  sub: string;
  ph: string;
}

const IntakeScreen = ({ onSubmit }: IntakeScreenProps) => {
  const { t } = useTheme();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({ role: "", want: "", fear: "" });
  const [current, setCurrent] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);


  const questions = useMemo<Question[]>(() => [
    {
      key: "role",
      eyebrow: "Let's start simply.",
      q: "What did you do, and for how long?",
      sub: "Your role, industry — whatever feels most relevant. One or two sentences is perfect.",
      ph: "e.g. Senior Finance Analyst at a mid-size bank, 12 years...",
    },
    {
      key: "want",
      eyebrow: "Good. Now the real question.",
      q: "What do you actually want from what comes next?",
      sub: "More income, more freedom, more meaning — or something you can't quite name yet. All valid.",
      ph: "e.g. Income that doesn't depend on someone else deciding my worth...",
    },
    {
      key: "fear",
      eyebrow: "Last one. This one matters most.",
      q: "What's the fear underneath all of this?",
      sub: "Nobody else reads this. Be honest with yourself.",
      ph: "e.g. That I spent 15 years building skills that no longer matter...",
    },
  ], []);

  useEffect(() => { ref.current?.focus(); }, [step]);

  const next = useCallback(() => {
    if (!current.trim()) return;
    const updated: UserAnswers = { ...answers, [questions[step].key]: current };
    setAnswers(updated);
    setCurrent("");
    if (step < questions.length - 1) {
      setAnimKey(k => k + 1);
      setStep(s => s + 1);
    } else {
      onSubmit(updated);
    }
  }, [current, answers, step, questions, onSubmit]);

  const q = questions[step];

  return (
    <div
      data-testid="intake-screen"
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px", position: "relative", zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 600, width: "100%" }}>

        {/* Progress bars */}
        <div style={{
          display: "flex", gap: 8, alignItems: "center", marginBottom: 52,
          animation: "fadeIn 0.5s ease forwards",
        }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i < step ? t.amber : i === step ? t.amberBorder : t.border,
              boxShadow: i < step ? `0 0 6px ${t.amberBg}` : "none",
              transition: "background 0.5s ease, box-shadow 0.5s ease",
            }} />
          ))}
          <div style={{ fontSize: 12, color: t.muted, whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
            {step + 1} / {questions.length}
          </div>
        </div>

        {/* Previous answers — dimmed so the current question dominates visually */}
        {step > 0 && (
          <div style={{ marginBottom: 32, opacity: 0.5 }}>
            {questions.slice(0, step).map((pq, i) => (
              <div key={i} style={{
                marginBottom: 10, padding: "10px 16px",
                background: t.bgCard, borderRadius: 8,
                border: `1px solid ${t.border}`,
                animation: "fadeIn 0.4s ease forwards",
                transition: "background 0.5s ease, border-color 0.5s ease",
              }}>
                <div style={{ fontSize: 11, color: t.muted, letterSpacing: "0.08em", marginBottom: 3 }}>
                  {pq.eyebrow}
                </div>
                <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.6, transition: "color 0.5s ease" }}>
                  {answers[pq.key]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current question — left-border framing mirrors the plan screen's accent treatment */}
        <div key={animKey} style={{
          animation: "fadeUp 0.5s ease forwards",
          borderLeft: `2px solid ${t.amberBorder}`,
          paddingLeft: 20,
          transition: "border-color 0.5s ease",
        }}>
          <div style={{
            fontSize: 12, color: t.amber, letterSpacing: "0.12em",
            marginBottom: 10, textTransform: "uppercase",
            transition: "color 0.5s ease",
          }}>
            {q.eyebrow}
          </div>
          <h2
            data-testid="intake-question"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 600,
              color: t.text, lineHeight: 1.3, marginBottom: 10,
              letterSpacing: "-0.01em", transition: "color 0.5s ease",
            }}
          >
            {q.q}
          </h2>
          <p style={{
            fontSize: 14, color: t.muted, lineHeight: 1.7,
            marginBottom: 28, fontWeight: 300, transition: "color 0.5s ease",
          }}>
            {q.sub}
          </p>

          <textarea
            data-testid="intake-textarea"
            ref={ref}
            value={current}
            onChange={e => {
              setCurrent(e.target.value);
              // Auto-resize to content height
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); next(); }
            }}
            placeholder={q.ph}
            style={{
              width: "100%",
              background: current ? t.bgCardHover : t.inputBg,
              border: `1px solid ${current ? t.borderHover : t.border}`,
              borderRadius: 10, padding: "16px 18px",
              color: t.text, fontSize: 15, lineHeight: 1.7,
              outline: "none", resize: "none", caretColor: t.amber,
              transition: "all 0.3s ease",
              boxShadow: current ? `0 0 0 3px ${t.amberBg}` : "none",
              minHeight: 96, overflow: "hidden",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <div style={{ fontSize: 12, color: t.muted }}>Press Enter to continue</div>
            <button
              data-testid="continue-btn"
              onClick={next}
              disabled={!current.trim()}
              className="btn-primary"
              style={{
                background: current.trim() ? t.btnPrimary : "transparent",
                border: `1px solid ${current.trim() ? t.btnPrimary : t.border}`,
                borderRadius: 8, color: current.trim() ? t.btnPrimaryText : t.muted,
                fontSize: 14, fontWeight: 500, padding: "12px 28px",
                cursor: current.trim() ? "pointer" : "not-allowed",
                boxShadow: current.trim() ? `0 4px 18px ${t.amberBg}` : "none",
                transition: "all 0.3s ease",
              }}
            >
              {step < questions.length - 1 ? "Continue →" : "Build my plan →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SCREEN 3 — BREATHING + PROCESSING
// ============================================================
interface BreathingScreenProps {
  onComplete: () => void;
}

type BreathPhase = "inhale" | "hold" | "exhale";

const BreathingScreen = ({ onComplete }: BreathingScreenProps) => {
  const { t } = useTheme();
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [affirmIdx, setAffirmIdx] = useState(0);
  const [agentIdx, setAgentIdx] = useState(0);
  const [done, setDone] = useState(false);

  const INHALE = 4000, HOLD = 2000, EXHALE = 4000, TOTAL = 10000;

  const affirmations = useMemo(() => [
    "What you've built doesn't disappear overnight.",
    "This pause is not the end. It's the reset.",
    "You have more options than you can see right now.",
    "The people who navigate this best planned early.",
    "You're already doing the hard part — facing it.",
    "Your next chapter doesn't erase the last one.",
    "This took courage. Coming here. Starting this.",
  ], []);

  const agents = useMemo(() => [
    "Reading your profile...",
    "Scanning market signals for your sector...",
    "Measuring disruption risk...",
    "Mapping transferable leverage...",
    "Generating three honest paths...",
    "Building your 30 · 60 · 90 plan...",
    "Running integrity check...",
    "Your plan is ready.",
  ], []);

  useEffect(() => {
    let cancelled = false;
    const cycle = async () => {
      if (cancelled) return;
      setPhase("inhale");
      await new Promise<void>(r => setTimeout(r, INHALE));
      if (cancelled) return;
      setPhase("hold");
      await new Promise<void>(r => setTimeout(r, HOLD));
      if (cancelled) return;
      setPhase("exhale");
      await new Promise<void>(r => setTimeout(r, EXHALE));
    };
    void cycle();
    const repeat = setTimeout(() => { if (!cancelled) void cycle(); }, TOTAL);
    const finish = setTimeout(() => { if (!cancelled) setDone(true); }, TOTAL * 2 - 500);
    const done_ = setTimeout(() => { if (!cancelled) onComplete(); }, TOTAL * 2 + 800);
    return () => {
      cancelled = true;
      clearTimeout(repeat);
      clearTimeout(finish);
      clearTimeout(done_);
    };
  }, [onComplete]);

  useEffect(() => {
    const id = setInterval(() => setAffirmIdx(i => (i + 1) % affirmations.length), 4800);
    return () => clearInterval(id);
  }, [affirmations.length]);

  useEffect(() => {
    const step = (TOTAL * 2) / agents.length;
    const timers = agents.map((_, i) =>
      setTimeout(() => setAgentIdx(Math.min(i, agents.length - 1)), step * i)
    );
    return () => timers.forEach(clearTimeout);
  }, [agents]);

  const expanded = phase === "inhale" || phase === "hold";
  const dur = phase === "hold" ? "0.3s" : "4s";
  const labels: Record<BreathPhase, string> = { inhale: "breathe in", hold: "hold", exhale: "breathe out" };

  return (
    <div
      data-testid="breathing-screen"
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 40, position: "relative", zIndex: 1, textAlign: "center",
      }}
    >
      {/* Breathing orb */}
      <div style={{
        position: "relative", width: 240, height: 240,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 52,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: `radial-gradient(circle, ${t.sageBg}, transparent 70%)`,
          transform: `scale(${expanded ? 1.5 : 0.9})`,
          transition: `transform ${dur} ease-in-out`,
        }} />
        <div style={{
          position: "absolute", width: 170, height: 170, borderRadius: "50%",
          border: `1.5px solid ${phase === "hold" ? t.sage : t.sageBorder}`,
          transform: `scale(${expanded ? 1.1 : 0.78})`,
          transition: `transform ${dur} ease-in-out, border-color 0.6s ease`,
          boxShadow: phase === "hold" ? `0 0 28px ${t.sageBg}` : "none",
        }} />
        <div style={{
          width: 84, height: 84, borderRadius: "50%",
          background: `radial-gradient(circle at 38% 33%, ${t.sage}, ${t.sageBorder})`,
          transform: `scale(${expanded ? 1.35 : 0.65})`,
          transition: `transform ${dur} ease-in-out`,
          boxShadow: `0 0 ${phase === "hold" ? "36px" : "16px"} ${t.sageBg}`,
        }} />
        <div style={{
          position: "absolute", bottom: -28, fontSize: 12,
          color: t.sage, letterSpacing: "0.22em",
          textTransform: "uppercase", fontWeight: 300,
          animation: "breatheText 2s ease-in-out infinite",
          transition: "color 0.5s ease",
        }}>
          {done ? "ready ✓" : labels[phase]}
        </div>
      </div>

      {/* Affirmation */}
      <div style={{ maxWidth: 440, marginBottom: 52, minHeight: 68 }}>
        <p key={affirmIdx} style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(17px, 3vw, 21px)",
          fontStyle: "italic", fontWeight: 400,
          color: t.text, lineHeight: 1.6,
          animation: "fadeUp 0.8s ease forwards", opacity: 0,
          transition: "color 0.5s ease",
        }}>
          &ldquo;{affirmations[affirmIdx]}&rdquo;
        </p>
      </div>

      {/* Agent steps */}
      <div style={{
        maxWidth: 360, width: "100%",
        background: t.bgCard,
        borderRadius: 10, padding: "18px 22px",
        border: `1px solid ${t.border}`,
        transition: "background 0.5s ease, border-color 0.5s ease",
      }}>
        {agents.map((agent, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: i < agents.length - 1 ? 9 : 0,
            opacity: i <= agentIdx ? 1 : 0.2,
            transition: "opacity 0.6s ease",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: i < agentIdx ? t.sage : i === agentIdx ? t.amber : t.border,
              boxShadow: i === agentIdx ? `0 0 8px ${t.amber}` : "none",
              animation: i === agentIdx ? "pulse 1.5s infinite" : "none",
              transition: "background 0.4s ease",
            }} />
            <div style={{
              fontSize: 12, color: i === agentIdx ? t.text : t.textDim,
              fontWeight: i === agentIdx ? 500 : 300,
              transition: "color 0.4s ease",
            }}>
              {agent}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// SCREEN 4 — PLAN
// ============================================================
interface PlanScreenProps {
  result: AnalysisResult;
}

const riskColor = (r: string, t: Theme): string =>
  r === "Low" ? t.sage : r === "Medium" ? t.amber : t.rose;

// Semantic fit bar gradient: endpoint color communicates score quality at a glance.
// ≥86% → sage (strong fit), 75–85% → amber (good fit), <75% → rose (possible fit)
const fitBarGradient = (fit: number, t: Theme): string => {
  const endpoint = fit >= 86 ? t.sage : fit >= 75 ? t.amber : t.rose;
  return `linear-gradient(90deg, ${t.sage}, ${endpoint})`;
};

const PlanScreen = ({ result }: PlanScreenProps) => {
  const { t } = useTheme();
  const [tab, setTab] = useState<"paths" | "plan">("paths");
  const [selPath, setSelPath] = useState(0);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipped, setTipped] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [emailError, setEmailError] = useState("");

  const p = result.paths[selPath];

  const handleTip = async (amountCents: number) => {
    setTipLoading(true);
    try {
      const res = await fetch("/api/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountCents }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Graceful fallback: mark as tipped locally
        setTipped(true);
      }
    } catch {
      setTipped(true);
    } finally {
      setTipLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email.includes("@")) return;
    setEmailLoading(true);
    setEmailError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setEmailDone(true);
      } else {
        setEmailError("Something went wrong. Try again.");
      }
    } catch {
      setEmailError("Something went wrong. Try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const tipAmounts: { label: string; cents: number }[] = [
    { label: "$5", cents: 500 },
    { label: "$10", cents: 1000 },
    { label: "$20", cents: 2000 },
    { label: "Whatever feels right", cents: 1500 },
  ];

  return (
    <div
      data-testid="plan-screen"
      style={{
        minHeight: "100vh", padding: "48px 24px 80px",
        position: "relative", zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36, animation: "fadeUp 0.6s ease forwards" }}>
          <div style={{
            fontSize: 11, color: t.amber, letterSpacing: "0.22em",
            textTransform: "uppercase", marginBottom: 12, opacity: 0.8,
          }}>
            Your Exit Protocol
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 600,
            color: t.text, lineHeight: 1.22, marginBottom: 16,
            letterSpacing: "-0.015em", transition: "color 0.5s ease",
          }}>
            {result.profile.profileSummary}
          </h1>
          <div style={{
            background: t.bgCard, border: `1px solid ${t.border}`,
            borderLeft: `3px solid ${t.amber}`,
            borderRadius: "0 8px 8px 0", padding: "14px 18px",
            fontSize: 14, color: t.textDim, lineHeight: 1.7,
            fontStyle: "italic", transition: "all 0.5s ease",
          }}>
            &ldquo;{result.profile.coreAnxiety}&rdquo;
            <div style={{ marginTop: 8, fontSize: 12, fontStyle: "normal", opacity: 0.6 }}>
              Skills we see: {result.profile.transferableSkills.join(" · ")}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", borderBottom: `1px solid ${t.border}`,
          marginBottom: 28, transition: "border-color 0.5s ease",
        }}>
          {(["paths", "plan"] as const).map(key => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: "transparent", border: "none",
              borderBottom: tab === key ? `2px solid ${t.amber}` : "2px solid transparent",
              color: tab === key ? t.text : t.muted,
              fontSize: 14, fontWeight: tab === key ? 500 : 400,
              padding: "10px 24px", cursor: "pointer",
              marginBottom: -1, transition: "all 0.25s ease",
              letterSpacing: "0.02em",
            }}>
              {key === "paths" ? "Three Paths" : "30 · 60 · 90 Plan"}
            </button>
          ))}
        </div>

        {/* ── PATHS TAB ── */}
        {tab === "paths" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <p style={{ fontSize: 13, color: t.muted, marginBottom: 20, lineHeight: 1.65 }}>
              Three honest options based on your profile. Select one to see your full plan.
            </p>
            {result.paths.map((path, i) => (
              <div
                key={i}
                data-testid="path-card"
                className="card-hover"
                onClick={() => { setSelPath(i); setTab("plan"); }}
                style={{
                  border: `1px solid ${selPath === i ? t.borderHover : t.border}`,
                  background: selPath === i ? t.amberBg : t.bgCard,
                  borderRadius: 12, padding: "22px 24px", marginBottom: 14,
                  cursor: "pointer",
                  boxShadow: selPath === i
                    ? `0 0 0 1px ${t.amberBorder}, 0 8px 32px rgba(0,0,0,0.12)`
                    : t.cardShadow,
                  transition: "all 0.3s ease",
                }}
              >
                {/* Top-accent stripe — color signals risk level at a glance */}
                <div style={{
                  height: 3,
                  borderRadius: "11px 11px 0 0",
                  marginTop: -22, marginLeft: -24, marginRight: -24, marginBottom: 18,
                  background: riskColor(path.riskLevel, t),
                  opacity: 0.55,
                  transition: "background 0.5s ease",
                }} />

                {/* Top row */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  flexWrap: "wrap", gap: 8, marginBottom: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 19, fontWeight: 600,
                      color: t.text, letterSpacing: "-0.01em",
                      transition: "color 0.5s ease",
                    }}>
                      {path.name}
                    </h3>
                    <span style={{
                      fontSize: 11, letterSpacing: "0.08em",
                      padding: "3px 9px", border: `1px solid ${t.border}`,
                      borderRadius: 4, color: t.textDim,
                      background: t.bgCard, transition: "all 0.5s ease",
                    }}>
                      {path.type}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: t.amber, transition: "color 0.5s ease" }}>
                      {path.revenueRange}
                    </div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>per month potential</div>
                  </div>
                </div>

                {/* Fit bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    marginBottom: 5, fontSize: 11, color: t.muted,
                  }}>
                    <span>Profile fit</span>
                    <span style={{ color: t.amber, fontWeight: 500 }}>{path.fit}%</span>
                  </div>
                  <div style={{ height: 3, background: t.border, borderRadius: 2 }}>
                    <div style={{
                      height: "100%", borderRadius: 2, width: `${path.fit}%`,
                      background: fitBarGradient(path.fit, t),
                      transition: "width 1.2s ease",
                    }} />
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
                  {([
                    ["First revenue", path.timeToFirstRevenue],
                    ["Effort", path.effortLevel],
                    ["Risk", path.riskLevel],
                  ] as [string, string][]).map(([label, val]) => (
                    <div key={label} style={{ fontSize: 12 }}>
                      <span style={{ color: t.muted }}>{label}: </span>
                      <span style={{ color: riskColor(val, t), fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 13, color: t.textDim, lineHeight: 1.65, marginBottom: 8, transition: "color 0.5s ease" }}>
                  {path.whyThisWorks}
                </p>
                <p style={{ fontSize: 12, color: t.rose, opacity: 0.85, transition: "color 0.5s ease" }}>
                  ↳ Honest obstacle: {path.biggestObstacle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── PLAN TAB ── */}
        {tab === "plan" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>

            {/* Sticky active-path banner — stays visible as user scrolls 30/60/90 content.
                Especially useful on mobile where the content is significantly longer. */}
            <div style={{
              position: "sticky", top: 0, zIndex: 10,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 8, padding: "10px 16px", marginBottom: 24, marginLeft: -24, marginRight: -24,
              background: t.amberBg,
              borderBottom: `1px solid ${t.amberBorder}`,
              backdropFilter: "blur(12px)",
              transition: "all 0.5s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: t.amber, boxShadow: `0 0 6px ${t.amber}`,
                }} />
                <span style={{ color: t.amber, fontWeight: 500, fontSize: 13 }}>{p.name}</span>
                <span style={{
                  fontSize: 11, color: t.muted, letterSpacing: "0.06em",
                  padding: "2px 7px", border: `1px solid ${t.amberBorder}`,
                  borderRadius: 4, background: "transparent",
                }}>
                  {p.type}
                </span>
              </div>
              <button
                onClick={() => setTab("paths")}
                style={{
                  background: "transparent", border: `1px solid ${t.amberBorder}`,
                  borderRadius: 6, color: t.amber, fontSize: 11,
                  padding: "4px 10px", cursor: "pointer", letterSpacing: "0.04em",
                  transition: "all 0.2s ease",
                }}
              >
                change path
              </button>
            </div>

            {/* First move */}
            <div style={{
              background: t.sageBg, border: `1px solid ${t.sageBorder}`,
              borderRadius: 10, padding: "18px 22px", marginBottom: 32,
              transition: "all 0.5s ease",
            }}>
              <div style={{
                fontSize: 11, color: t.sage, letterSpacing: "0.16em",
                textTransform: "uppercase", marginBottom: 8,
              }}>
                Do this today
              </div>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 17, fontWeight: 600, color: t.text, lineHeight: 1.5,
                transition: "color 0.5s ease",
              }}>
                {result.plan.firstMove}
              </p>
            </div>

            {/* 30 / 60 / 90 */}
            {(["day30", "day60", "day90"] as const).map((key, idx) => {
              const accent = [t.amber, t.sage, t.textDim][idx];
              const label = ["Day 30", "Day 60", "Day 90"][idx];
              const delay = `${idx * 0.12}s`;
              const m = result.plan[key];
              return (
                <div key={key} style={{
                  marginBottom: 28, paddingLeft: 20,
                  borderLeft: `2px solid ${accent}`,
                  opacity: 0, animation: `fadeUp 0.5s ${delay} ease forwards`,
                  transition: "border-color 0.5s ease",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 6, marginBottom: 12, alignItems: "baseline",
                  }}>
                    <div style={{
                      fontSize: 13, color: accent, fontWeight: 600,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                    }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 12, color: t.muted, fontStyle: "italic" }}>
                      Milestone: {m.milestone}
                    </div>
                  </div>
                  {m.actions.map((action, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14, lineHeight: 1.65 }}>
                      <span style={{ color: accent, opacity: 0.6, marginTop: 2, flexShrink: 0 }}>→</span>
                      <span style={{ color: t.textDim, transition: "color 0.5s ease" }}>{action}</span>
                    </div>
                  ))}
                  <div style={{
                    marginTop: 10, fontSize: 12, color: t.sage, opacity: 0.75,
                    paddingTop: 8, borderTop: `1px solid ${t.border}`,
                    transition: "color 0.5s ease, border-color 0.5s ease",
                  }}>
                    ✓ You&apos;ll know it&apos;s working when: {m.metric}
                  </div>
                </div>
              );
            })}

            {/* Warning */}
            <div style={{
              background: t.roseBg, border: `1px solid ${t.roseBorder}`,
              borderRadius: 8, padding: "14px 18px", marginBottom: 40,
              fontSize: 13, color: t.textDim, lineHeight: 1.7,
              transition: "all 0.5s ease",
            }}>
              <span style={{ color: t.rose, fontWeight: 500, transition: "color 0.5s ease" }}>⚠ Warning signal: </span>
              {result.plan.warning}
            </div>

            {/* Happiness Advantage */}
            <div data-testid="happiness-advantage" style={{ marginBottom: 40 }}>
              <div style={{
                fontSize: 11, color: t.sage, letterSpacing: "0.18em",
                textTransform: "uppercase", marginBottom: 16, fontWeight: 500,
              }}>
                The Happiness Advantage
              </div>

              {/* Glass half full */}
              <div style={{
                background: t.sageBg, border: `1px solid ${t.sageBorder}`,
                borderRadius: 10, padding: "18px 22px", marginBottom: 12,
                transition: "all 0.5s ease",
              }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 10,
                  transition: "color 0.5s ease",
                }}>
                  {result.happinessAdvantage.glassHalfFull.headline}
                </div>
                {result.happinessAdvantage.glassHalfFull.wins.map((win, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: t.textDim }}>
                    <span style={{ color: t.sage, flexShrink: 0 }}>✓</span>
                    <span>{win}</span>
                  </div>
                ))}
              </div>

              {/* Falling up */}
              <div style={{
                background: t.bgCard, border: `1px solid ${t.border}`,
                borderLeft: `3px solid ${t.sage}`,
                borderRadius: "0 8px 8px 0", padding: "14px 18px", marginBottom: 12,
                fontSize: 13, color: t.textDim, lineHeight: 1.7,
                fontStyle: "italic", transition: "all 0.5s ease",
              }}>
                {result.happinessAdvantage.fallingUp}
              </div>

              {/* Tetris effect */}
              <div style={{
                background: t.amberBg, border: `1px solid ${t.amberBorder}`,
                borderRadius: 10, padding: "16px 20px", marginBottom: 12,
                transition: "all 0.5s ease",
              }}>
                <div style={{ fontSize: 11, color: t.amber, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                  Tetris Effect — train your brain to spot opportunity
                </div>
                <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.65, marginBottom: 6 }}>
                  {result.happinessAdvantage.tetrisEffect.prompt}
                </div>
                <div style={{ fontSize: 12, color: t.muted, fontStyle: "italic" }}>
                  e.g. {result.happinessAdvantage.tetrisEffect.example}
                </div>
              </div>

              {/* Daily practice */}
              <div style={{
                background: t.bgCard, border: `1px solid ${t.border}`,
                borderRadius: 10, padding: "16px 20px",
                transition: "all 0.5s ease",
              }}>
                <div style={{ fontSize: 11, color: t.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                  Daily practice
                </div>
                {(["day30", "day60", "day90"] as const).map((k, i) => (
                  <div key={k} style={{ display: "flex", gap: 12, marginBottom: i < 2 ? 10 : 0, fontSize: 13 }}>
                    <span style={{ color: [t.amber, t.sage, t.textDim][i], fontWeight: 600, flexShrink: 0, width: 44 }}>
                      {["D30", "D60", "D90"][i]}
                    </span>
                    <span style={{ color: t.textDim, lineHeight: 1.6 }}>
                      {result.happinessAdvantage.dailyPractice[k]}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, fontSize: 11, color: t.muted, textAlign: "right", fontStyle: "italic" }}>
                {result.happinessAdvantage.attribution}
              </div>
            </div>

            {/* Tip jar */}
            <div data-testid="tip-jar">
              {!tipped ? (
                <div style={{
                  border: `1px solid ${t.border}`, borderRadius: 12,
                  padding: "28px 24px", marginBottom: 20, textAlign: "center",
                  background: t.bgCard, transition: "all 0.5s ease",
                }}>
                  <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 20, fontWeight: 600, color: t.text, marginBottom: 6,
                    transition: "color 0.5s ease",
                  }}>
                    Did this land?
                  </p>
                  <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.65, marginBottom: 24 }}>
                    No subscription pressure. No upsell. If this gave you clarity,
                    a tip keeps the lights on and the plans honest.
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    {tipAmounts.map(({ label, cents }) => (
                      <button
                        key={label}
                        data-testid={`tip-btn-${cents / 100}`}
                        onClick={() => { void handleTip(cents); }}
                        disabled={tipLoading}
                        className="btn-primary"
                        style={{
                          background: t.amberBg, border: `1px solid ${t.amberBorder}`,
                          borderRadius: 8, color: t.amber, fontSize: 14,
                          padding: "10px 18px", cursor: tipLoading ? "wait" : "pointer",
                          transition: "all 0.25s ease", opacity: tipLoading ? 0.7 : 1,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: t.sageBg, border: `1px solid ${t.sageBorder}`,
                  borderRadius: 12, padding: "20px 24px", marginBottom: 20,
                  textAlign: "center", transition: "all 0.5s ease",
                }}>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18, color: t.sage, marginBottom: 4,
                  }}>
                    Appreciated. Genuinely.
                  </div>
                  <div style={{ fontSize: 13, color: t.muted }}>
                    This helps keep the analysis honest and the tool free.
                  </div>
                </div>
              )}
            </div>

            {/* Email capture */}
            {!emailDone ? (
              <div style={{
                background: t.bgCard, border: `1px solid ${t.border}`,
                borderRadius: 12, padding: "24px",
                transition: "all 0.5s ease",
              }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18, color: t.text, marginBottom: 6,
                  transition: "color 0.5s ease",
                }}>
                  Your plan is a snapshot. The world isn&apos;t.
                </div>
                <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.7, marginBottom: 20 }}>
                  Job market shifts. Sector signals change. New tools emerge.
                  We refresh your 30/60/90 monthly so your plan stays real.
                  Free for 30 days. No card.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    data-testid="email-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { void handleEmail(); } }}
                    type="email"
                    placeholder="your@email.com"
                    style={{
                      flex: 1, minWidth: 200,
                      background: email ? t.bgCardHover : t.inputBg,
                      border: `1px solid ${email ? t.borderHover : t.border}`,
                      borderRadius: 8, padding: "12px 16px",
                      color: t.text, fontSize: 14, outline: "none",
                      transition: "all 0.3s ease",
                    }}
                  />
                  <button
                    data-testid="email-submit"
                    onClick={() => { void handleEmail(); }}
                    disabled={emailLoading || !email.includes("@")}
                    className="btn-primary"
                    style={{
                      background: t.btnPrimary, border: "none",
                      borderRadius: 8, color: t.btnPrimaryText,
                      fontSize: 14, fontWeight: 500, padding: "12px 22px",
                      cursor: emailLoading ? "wait" : "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: `0 4px 16px ${t.amberBg}`,
                      transition: "all 0.3s ease",
                      opacity: emailLoading ? 0.7 : 1,
                    }}
                  >
                    {emailLoading ? "Saving..." : "Keep my plan live →"}
                  </button>
                </div>
                {emailError && (
                  <div style={{ marginTop: 10, fontSize: 12, color: t.rose }}>{emailError}</div>
                )}
              </div>
            ) : (
              <div
                data-testid="email-success"
                style={{
                  background: t.sageBg, border: `1px solid ${t.sageBorder}`,
                  borderRadius: 12, padding: "20px 24px",
                  transition: "all 0.5s ease",
                }}
              >
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18, color: t.sage, marginBottom: 4,
                }}>
                  You&apos;re in.
                </div>
                <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.7 }}>
                  First refresh arrives in 30 days. By then you&apos;ll have real data from your own moves.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 60, paddingTop: 20,
          borderTop: `1px solid ${t.footerBorder}`,
          display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
          fontSize: 11, color: t.muted, letterSpacing: "0.05em",
          transition: "border-color 0.5s ease",
        }}>
          <span>GLITCHED · Built for the displaced</span>
          <span style={{ color: t.amber, opacity: 0.7 }}>AWAF VERIFIED · glitched.sh</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ============================================================
// ERROR SCREEN
// ============================================================

const ErrorScreen = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTheme();
  return (
    <div data-testid="error-screen" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem", textAlign: "center",
    }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "1.25rem" }}>⚡</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", color: t.text, margin: "0 0 0.75rem" }}>
        Oh snap.
      </h2>
      <p style={{ color: t.textDim, fontSize: "1rem", maxWidth: "360px", lineHeight: 1.6, margin: "0 0 2rem" }}>
        We couldn&apos;t reach the analysis service. Check your connection and try again.
      </p>
      <button
        data-testid="error-retry-btn"
        onClick={onRetry}
        style={{
          background: t.btnPrimary, color: t.btnPrimaryText,
          border: "none", borderRadius: "8px",
          padding: "0.75rem 2rem", fontSize: "1rem",
          fontWeight: 600, cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
};

// ============================================================
// APP SHELL — Theme provider + screen router
// ============================================================

type Screen = "landing" | "intake" | "breathing" | "plan" | "error";

const bgPhaseMap: Record<Screen, BgPhase> = {
  landing:   "neutral",
  intake:    "neutral",
  breathing: "breathing",
  error:     "neutral",
  plan:      "plan",
};

export default function Glitched() {
  const [isDark, setIsDark] = useState(true);
  const [screen, setScreen] = useState<Screen>("landing");
  const [screenVisible, setScreenVisible] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [breathingDone, setBreathingDone] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateTo = useCallback((next: Screen) => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    setScreenVisible(false);
    navTimerRef.current = setTimeout(() => {
      setScreen(next);
      setScreenVisible(true);
      navTimerRef.current = null;
    }, 280);
  }, []);

  const t = isDark ? DARK : LIGHT;
  const toggle = () => setIsDark(d => !d);

  // Support ?mock=plan for E2E tests that skip the intake flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mock") === "plan") {
      setAnalysisResult(MOCK_RESULT);
      setScreen("plan");
    }
    // Handle Stripe redirect
    if (params.get("tipped") === "true") {
      setAnalysisResult(prev => prev ?? MOCK_RESULT);
      setScreen("plan");
    }
  }, []);

  const handleIntakeSubmit = useCallback(async (answers: UserAnswers) => {
    navigateTo("breathing");
    setBreathingDone(false);

    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

    if (useMock) {
      // Simulate API latency so breathing screen plays naturally
      await new Promise<void>(r => setTimeout(r, 8000));
      setAnalysisResult(MOCK_RESULT);
      return;
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = (await res.json()) as AnalysisResult;
      setAnalysisResult(data);
    } catch {
      navigateTo("error");
    }
  }, [navigateTo]);

  // Navigate to plan when BOTH breathing animation AND API are done
  const handleBreathingComplete = useCallback(() => {
    setBreathingDone(true);
  }, []);

  useEffect(() => {
    if (breathingDone && analysisResult !== null) {
      navigateTo("plan");
    }
  }, [breathingDone, analysisResult, navigateTo]);

  return (
    <ThemeCtx.Provider value={{ t, isDark, toggle }}>
      <div style={{
        background: t.bg, minHeight: "100vh", color: t.text,
        transition: "background 0.5s ease, color 0.5s ease",
      }}>
        <GlobalStyle t={t} isDark={isDark} />
        <AmbientBg phase={bgPhaseMap[screen]} />
        <ThemeToggle />

        <div style={{ opacity: screenVisible ? 1 : 0, transition: "opacity 0.28s ease" }}>
          {screen === "landing"   && (
            <LandingScreen onBegin={() => navigateTo("intake")} />
          )}
          {screen === "intake"    && (
            <IntakeScreen onSubmit={answers => { void handleIntakeSubmit(answers); }} />
          )}
          {screen === "breathing" && (
            <BreathingScreen onComplete={handleBreathingComplete} />
          )}
          {screen === "plan" && analysisResult && (
            <PlanScreen result={analysisResult} />
          )}
          {screen === "error" && (
            <ErrorScreen onRetry={() => navigateTo("intake")} />
          )}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
