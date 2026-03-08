import { useState, useEffect, useRef, createContext, useContext } from "react";

// ============================================================
// THEME SYSTEM
// Dark: Deep navy + warm cream + amber
// Light: Warm parchment + ink + amber
// ============================================================

const DARK = {
  bg:          "#0D1B2A",
  bgMid:       "#162436",
  bgCard:      "rgba(245,237,214,0.04)",
  bgCardHover: "rgba(245,237,214,0.07)",
  text:        "#FDFAF4",
  textDim:     "#C9BFA8",
  muted:       "rgba(245,237,214,0.42)",
  amber:       "#E8A045",
  amberDim:    "#C4823A",
  amberBg:     "rgba(232,160,69,0.08)",
  amberBorder: "rgba(232,160,69,0.35)",
  sage:        "#7BAE8F",
  sageBg:      "rgba(123,174,143,0.08)",
  sageBorder:  "rgba(123,174,143,0.25)",
  rose:        "#C97B7B",
  roseBg:      "rgba(201,123,123,0.07)",
  roseBorder:  "rgba(201,123,123,0.2)",
  border:      "rgba(245,237,214,0.11)",
  borderHover: "rgba(232,160,69,0.4)",
  scrollTrack: "#0D1B2A",
  scrollThumb: "rgba(232,160,69,0.3)",
  grad1:       "rgba(232,160,69,0.07)",
  grad2:       "rgba(123,174,143,0.05)",
  btnPrimary:  "#E8A045",
  btnPrimaryText: "#0D1B2A",
  inputBg:     "rgba(245,237,214,0.05)",
  footerBorder:"rgba(245,237,214,0.08)",
};

const LIGHT = {
  bg:          "#FAF6EE",
  bgMid:       "#F2EBD9",
  bgCard:      "rgba(255,255,255,0.7)",
  bgCardHover: "rgba(255,255,255,0.95)",
  text:        "#1A1208",
  textDim:     "#4A3F2F",
  muted:       "rgba(26,18,8,0.45)",
  amber:       "#B8640A",
  amberDim:    "#8C4C08",
  amberBg:     "rgba(184,100,10,0.08)",
  amberBorder: "rgba(184,100,10,0.3)",
  sage:        "#3D7A57",
  sageBg:      "rgba(61,122,87,0.08)",
  sageBorder:  "rgba(61,122,87,0.25)",
  rose:        "#9B4040",
  roseBg:      "rgba(155,64,64,0.07)",
  roseBorder:  "rgba(155,64,64,0.2)",
  border:      "rgba(26,18,8,0.1)",
  borderHover: "rgba(184,100,10,0.35)",
  scrollTrack: "#FAF6EE",
  scrollThumb: "rgba(184,100,10,0.25)",
  grad1:       "rgba(184,100,10,0.05)",
  grad2:       "rgba(61,122,87,0.04)",
  btnPrimary:  "#B8640A",
  btnPrimaryText: "#FAF6EE",
  inputBg:     "rgba(255,255,255,0.6)",
  footerBorder:"rgba(26,18,8,0.08)",
};

const ThemeCtx = createContext({ t: DARK, isDark: true, toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

// ============================================================
// GLOBAL STYLES (injected dynamically per theme)
// ============================================================
const GlobalStyle = ({ t, isDark }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');

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
    @keyframes breatheText { 0%,100%{opacity:0.45} 50%{opacity:1} }
    @keyframes toggleSlide {
      from { transform: translateX(0); }
      to   { transform: translateX(22px); }
    }
    @keyframes shimmerLight {
      0%   { opacity: 0; transform: scale(0.8); }
      50%  { opacity: 1; transform: scale(1.1); }
      100% { opacity: 0; transform: scale(1.4); }
    }

    textarea::placeholder, input::placeholder { color: ${t.muted}; }
    textarea, input, button { font-family: 'DM Sans', sans-serif; }

    .fade-up { animation: fadeUp 0.6s ease forwards; }

    .card-hover {
      transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    }
    .card-hover:hover {
      transform: translateY(-1px);
    }

    .btn-primary {
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      opacity: 0.92;
    }
    .btn-primary:active { transform: translateY(0); }
  `}</style>
);

// ============================================================
// THEME TOGGLE BUTTON
// ============================================================
const ThemeToggle = () => {
  const { t, isDark, toggle } = useTheme();
  return (
    <button
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
      {/* Track */}
      <div style={{
        width: 38, height: 20, borderRadius: 10,
        background: isDark ? "rgba(232,160,69,0.25)" : "rgba(184,100,10,0.15)",
        position: "relative",
        border: `1px solid ${t.amberBorder}`,
        transition: "background 0.3s ease",
      }}>
        {/* Knob */}
        <div style={{
          position: "absolute", top: 2,
          left: isDark ? 18 : 2,
          width: 14, height: 14, borderRadius: "50%",
          background: t.amber,
          transition: "left 0.3s ease",
          boxShadow: `0 0 8px ${t.amber}`,
        }} />
      </div>
      {/* Icon */}
      <span style={{ fontSize: 14, lineHeight: 1 }}>
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
};

// ============================================================
// AMBIENT BACKGROUND
// ============================================================
const AmbientBg = ({ phase }) => {
  const { t } = useTheme();
  const configs = {
    neutral:   [t.grad1, t.grad2],
    breathing: [t.sageBg, t.amberBg],
    plan:      [t.amberBg, t.sageBg],
  };
  const [c1, c2] = configs[phase] || configs.neutral;

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      background: `
        radial-gradient(ellipse 65% 55% at 15% 25%, ${c1}, transparent),
        radial-gradient(ellipse 55% 65% at 85% 75%, ${c2}, transparent),
        ${t.bg}
      `,
      transition: "background 1.8s ease",
    }} />
  );
};

// ============================================================
// SCREEN 1 — LANDING
// ============================================================
const LandingScreen = ({ onBegin }) => {
  const { t } = useTheme();
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px", position: "relative", zIndex: 1,
    }}>
      {visible && <>
        {/* Logo orb */}
        <div style={{
          animation: "fadeUp 0.7s ease forwards",
          marginBottom: 44, textAlign: "center",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            border: `1.5px solid ${t.amber}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: `0 0 36px ${t.amberBg}`,
            animation: "float 4s ease-in-out infinite",
            background: t.amberBg,
            transition: "all 0.5s ease",
          }}>
            <div style={{
              width: 11, height: 11, borderRadius: "50%",
              background: t.amber,
              boxShadow: `0 0 14px ${t.amber}`,
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
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(30px, 6vw, 52px)",
            fontWeight: 600, lineHeight: 1.18,
            color: t.text, marginBottom: 14, letterSpacing: "-0.02em",
            transition: "color 0.5s ease",
          }}>
            You've been{" "}
            <em style={{ color: t.amber, fontStyle: "italic", transition: "color 0.5s ease" }}>
              glitched.
            </em><br />
            Let's fix that.
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
            Laid off. Restructured out. Replaced by a system that didn't
            ask permission. If you're here, you already know the feeling.
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
          Built for the glitched. By someone who's been there.
        </div>
      </>}
    </div>
  );
};

// ============================================================
// SCREEN 2 — INTAKE
// ============================================================
const IntakeScreen = ({ onSubmit }) => {
  const { t } = useTheme();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ role: "", want: "", fear: "" });
  const [current, setCurrent] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const ref = useRef(null);

  const questions = [
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
  ];

  useEffect(() => { ref.current?.focus(); }, [step]);

  const next = () => {
    if (!current.trim()) return;
    const a = { ...answers, [questions[step].key]: current };
    setAnswers(a);
    setCurrent("");
    if (step < questions.length - 1) { setAnimKey(k => k+1); setStep(step+1); }
    else onSubmit(a);
  };

  const q = questions[step];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px", position: "relative", zIndex: 1,
    }}>
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

        {/* Previous answers */}
        {step > 0 && (
          <div style={{ marginBottom: 32 }}>
            {questions.slice(0, step).map((pq, i) => (
              <div key={i} style={{
                marginBottom: 10, padding: "10px 16px",
                background: t.bgCard, borderRadius: 8,
                border: `1px solid ${t.border}`,
                animation: "fadeIn 0.4s ease forwards",
                transition: "background 0.5s ease, border-color 0.5s ease",
              }}>
                <div style={{ fontSize: 11, color: t.amber, letterSpacing: "0.08em", marginBottom: 3, opacity: 0.8 }}>
                  {pq.eyebrow}
                </div>
                <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.6, transition: "color 0.5s ease" }}>
                  {answers[pq.key]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current question */}
        <div key={animKey} style={{ animation: "fadeUp 0.5s ease forwards" }}>
          <div style={{ fontSize: 12, color: t.amber, letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase", transition: "color 0.5s ease" }}>
            {q.eyebrow}
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 600,
            color: t.text, lineHeight: 1.3, marginBottom: 10,
            letterSpacing: "-0.01em", transition: "color 0.5s ease",
          }}>
            {q.q}
          </h2>
          <p style={{ fontSize: 14, color: t.muted, lineHeight: 1.7, marginBottom: 28, fontWeight: 300, transition: "color 0.5s ease" }}>
            {q.sub}
          </p>

          <textarea
            ref={ref}
            value={current}
            onChange={e => setCurrent(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); next(); } }}
            placeholder={q.ph}
            rows={3}
            style={{
              width: "100%",
              background: current ? t.bgCardHover : t.inputBg,
              border: `1px solid ${current ? t.borderHover : t.border}`,
              borderRadius: 10, padding: "16px 18px",
              color: t.text, fontSize: 15, lineHeight: 1.7,
              outline: "none", resize: "none", caretColor: t.amber,
              transition: "all 0.3s ease",
              boxShadow: current ? `0 0 0 3px ${t.amberBg}` : "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <div style={{ fontSize: 12, color: t.muted }}>Press Enter to continue</div>
            <button
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
const BreathingScreen = ({ onComplete }) => {
  const { t } = useTheme();
  const [phase, setPhase] = useState("inhale");
  const [affirmIdx, setAffirmIdx] = useState(0);
  const [agentIdx, setAgentIdx]   = useState(0);
  const [done, setDone]           = useState(false);

  const INHALE = 4000, HOLD = 2000, EXHALE = 4000, TOTAL = 10000;

  const affirmations = [
    "What you've built doesn't disappear overnight.",
    "This pause is not the end. It's the reset.",
    "You have more options than you can see right now.",
    "The people who navigate this best planned early.",
    "You're already doing the hard part — facing it.",
    "Your next chapter doesn't erase the last one.",
    "This took courage. Coming here. Starting this.",
  ];

  const agents = [
    "Reading your profile...",
    "Scanning market signals for your sector...",
    "Measuring disruption risk...",
    "Mapping transferable leverage...",
    "Generating three honest paths...",
    "Building your 30 · 60 · 90 plan...",
    "Running integrity check...",
    "Your plan is ready.",
  ];

  // Breath cycle loop
  useEffect(() => {
    let cancelled = false;
    const cycle = async () => {
      if (cancelled) return;
      setPhase("inhale");
      await new Promise(r => setTimeout(r, INHALE));
      if (cancelled) return;
      setPhase("hold");
      await new Promise(r => setTimeout(r, HOLD));
      if (cancelled) return;
      setPhase("exhale");
      await new Promise(r => setTimeout(r, EXHALE));
    };
    cycle();
    const repeat = setTimeout(() => { if (!cancelled) cycle(); }, TOTAL);
    const finish = setTimeout(() => { if (!cancelled) setDone(true); }, TOTAL * 2 - 500);
    const done_  = setTimeout(() => { if (!cancelled) onComplete(); }, TOTAL * 2 + 800);
    return () => { cancelled = true; clearTimeout(repeat); clearTimeout(finish); clearTimeout(done_); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAffirmIdx(i => (i+1) % affirmations.length), 4800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const step = (TOTAL * 2) / agents.length;
    const timers = agents.map((_, i) =>
      setTimeout(() => setAgentIdx(Math.min(i, agents.length-1)), step * i)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const expanded = phase === "inhale" || phase === "hold";
  const dur = phase === "hold" ? "0.3s" : "4s";

  const labels = { inhale: "breathe in", hold: "hold", exhale: "breathe out" };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 40, position: "relative", zIndex: 1, textAlign: "center",
    }}>

      {/* Breathing orb */}
      <div style={{
        position: "relative", width: 240, height: 240,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 52,
      }}>
        {/* Outer aura */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: `radial-gradient(circle, ${t.sageBg}, transparent 70%)`,
          transform: `scale(${expanded ? 1.5 : 0.9})`,
          transition: `transform ${dur} ease-in-out`,
        }} />
        {/* Ring */}
        <div style={{
          position: "absolute", width: 170, height: 170, borderRadius: "50%",
          border: `1.5px solid ${phase === "hold" ? t.sage : t.sageBorder}`,
          transform: `scale(${expanded ? 1.1 : 0.78})`,
          transition: `transform ${dur} ease-in-out, border-color 0.6s ease`,
          boxShadow: phase === "hold" ? `0 0 28px ${t.sageBg}` : "none",
        }} />
        {/* Inner */}
        <div style={{
          width: 84, height: 84, borderRadius: "50%",
          background: `radial-gradient(circle at 38% 33%, ${t.sage}, ${t.sageBorder})`,
          transform: `scale(${expanded ? 1.35 : 0.65})`,
          transition: `transform ${dur} ease-in-out`,
          boxShadow: `0 0 ${phase === "hold" ? "36px" : "16px"} ${t.sageBg}`,
        }} />
        {/* Label */}
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
          "{affirmations[affirmIdx]}"
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
            marginBottom: i < agents.length-1 ? 9 : 0,
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

const MOCK = {
  profile: {
    sector: "Finance", seniority: "Senior",
    skills: ["Financial Modeling", "Data Analysis", "Stakeholder Management"],
    goal: "Freedom",
    anxiety: "Being irrelevant in a world that no longer needs what I spent 15 years mastering.",
    summary: "Your skills didn't become worthless. The packaging did.",
  },
  paths: [
    {
      name: "The Fractional CFO", type: "Freelance",
      first: "30–45 days", effort: "Medium", revenue: "$8k – $20k/mo", risk: "Low", fit: 94,
      why: "Small companies need your exact skills but can't afford full-time. Your 15 years is the product.",
      obstacle: "Landing the first client. After that it's referrals.",
    },
    {
      name: "The AI Finance Translator", type: "Build",
      first: "60–90 days", effort: "High", revenue: "$3k – $15k/mo", risk: "Medium", fit: 81,
      why: "Finance teams need someone who speaks both the numbers and the AI tools. You're rare right now.",
      obstacle: "Building distribution. The skill exists — the audience doesn't know you yet.",
    },
    {
      name: "The Systematic Trader", type: "Invest",
      first: "90–180 days", effort: "High", revenue: "$2k – $10k/mo", risk: "High", fit: 67,
      why: "Your modeling skills translate directly to systematic strategy. Most traders can't build models.",
      obstacle: "Capital requirements and the gap between theory and living the volatility.",
    },
  ],
  plan: {
    firstMove: "Write one post tonight: 'After 15 years in finance, here's what AI actually can't replace.' Publish it.",
    warning: "If no discovery calls by day 30, the messaging isn't landing. Rewrite the offer, not the platform.",
    day30: {
      milestone: "First paying client or LOI signed",
      actions: [
        "Message 20 former colleagues about fractional CFO availability — personal, not broadcast",
        "Set up a one-page site with your offer. Done beats perfect.",
        "Join 2 communities where founders vent about financial chaos",
      ],
      metric: "3 discovery calls booked",
    },
    day60: {
      milestone: "First invoice sent",
      actions: [
        "Deliver month one of real value to your first client",
        "Ask for one specific referral — not 'anyone you know,' but name the type",
        "Document your process so it doesn't only live in your head",
      ],
      metric: "One client paying, one in pipeline",
    },
    day90: {
      milestone: "Predictable $8k/month baseline",
      actions: [
        "Raise rates for new clients — scarcity is now real",
        "Decide: stay fractional or build a product layer on top",
        "Fire the client that's 80% of your stress for 20% of income",
      ],
      metric: "Three retainer clients. Calendar yours to control.",
    },
  },
};

const riskColor = (r, t) =>
  r === "Low" ? t.sage : r === "Medium" ? t.amber : t.rose;

const PlanScreen = () => {
  const { t } = useTheme();
  const [tab, setTab]           = useState("paths");
  const [selPath, setSelPath]   = useState(0);
  const [tipped, setTipped]     = useState(false);
  const [email, setEmail]       = useState("");
  const [emailDone, setEmailDone] = useState(false);

  const p = MOCK.paths[selPath];

  return (
    <div style={{
      minHeight: "100vh", padding: "48px 24px 80px",
      position: "relative", zIndex: 1,
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36, animation: "fadeUp 0.6s ease forwards" }}>
          <div style={{ fontSize: 11, color: t.amber, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 12, opacity: 0.8 }}>
            Your Exit Protocol
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 600,
            color: t.text, lineHeight: 1.22, marginBottom: 16,
            letterSpacing: "-0.015em", transition: "color 0.5s ease",
          }}>
            {MOCK.profile.summary}
          </h1>
          <div style={{
            background: t.bgCard, border: `1px solid ${t.border}`,
            borderLeft: `3px solid ${t.amber}`,
            borderRadius: "0 8px 8px 0", padding: "14px 18px",
            fontSize: 14, color: t.textDim, lineHeight: 1.7,
            fontStyle: "italic", transition: "all 0.5s ease",
          }}>
            "{MOCK.profile.anxiety}"
            <div style={{ marginTop: 8, fontSize: 12, fontStyle: "normal", opacity: 0.6 }}>
              Skills we see: {MOCK.profile.skills.join(" · ")}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", borderBottom: `1px solid ${t.border}`,
          marginBottom: 28, transition: "border-color 0.5s ease",
        }}>
          {[["paths", "Three Paths"], ["plan", "30 · 60 · 90 Plan"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: "transparent", border: "none",
              borderBottom: tab === key ? `2px solid ${t.amber}` : "2px solid transparent",
              color: tab === key ? t.text : t.muted,
              fontSize: 14, fontWeight: tab === key ? 500 : 400,
              padding: "10px 24px", cursor: "pointer",
              marginBottom: -1, transition: "all 0.25s ease",
              letterSpacing: "0.02em",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── PATHS TAB ── */}
        {tab === "paths" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <p style={{ fontSize: 13, color: t.muted, marginBottom: 20, lineHeight: 1.65 }}>
              Three honest options based on your profile. Select one to see your full plan.
            </p>
            {MOCK.paths.map((path, i) => (
              <div
                key={i}
                className="card-hover"
                onClick={() => { setSelPath(i); setTab("plan"); }}
                style={{
                  border: `1px solid ${selPath === i ? t.borderHover : t.border}`,
                  background: selPath === i ? t.amberBg : t.bgCard,
                  borderRadius: 12, padding: "22px 24px", marginBottom: 14,
                  cursor: "pointer",
                  boxShadow: selPath === i ? `0 0 0 1px ${t.amberBorder}, 0 8px 32px rgba(0,0,0,0.08)` : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
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
                      {path.revenue}
                    </div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>per month potential</div>
                  </div>
                </div>

                {/* Fit bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11, color: t.muted }}>
                    <span>Profile fit</span>
                    <span style={{ color: t.amber, fontWeight: 500 }}>{path.fit}%</span>
                  </div>
                  <div style={{ height: 3, background: t.border, borderRadius: 2 }}>
                    <div style={{
                      height: "100%", borderRadius: 2, width: `${path.fit}%`,
                      background: `linear-gradient(90deg, ${t.sage}, ${t.amber})`,
                      transition: "width 1.2s ease",
                    }} />
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
                  {[["First revenue", path.first], ["Effort", path.effort], ["Risk", path.risk]].map(([label, val]) => (
                    <div key={label} style={{ fontSize: 12 }}>
                      <span style={{ color: t.muted }}>{label}: </span>
                      <span style={{ color: riskColor(val, t), fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 13, color: t.textDim, lineHeight: 1.65, marginBottom: 8, transition: "color 0.5s ease" }}>
                  {path.why}
                </p>
                <p style={{ fontSize: 12, color: t.rose, opacity: 0.85, transition: "color 0.5s ease" }}>
                  ↳ Honest obstacle: {path.obstacle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── PLAN TAB ── */}
        {tab === "plan" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>

            {/* Active path pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: t.amberBg, border: `1px solid ${t.amberBorder}`,
              borderRadius: 24, padding: "6px 14px", marginBottom: 28, fontSize: 13,
              transition: "all 0.5s ease",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: t.amber, boxShadow: `0 0 6px ${t.amber}`,
              }} />
              <span style={{ color: t.amber, fontWeight: 500 }}>{p.name}</span>
              <span
                onClick={() => setTab("paths")}
                style={{ color: t.muted, fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
              >
                change
              </span>
            </div>

            {/* First move */}
            <div style={{
              background: t.sageBg, border: `1px solid ${t.sageBorder}`,
              borderRadius: 10, padding: "18px 22px", marginBottom: 32,
              transition: "all 0.5s ease",
            }}>
              <div style={{ fontSize: 11, color: t.sage, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                Do this today
              </div>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 17, fontWeight: 600, color: t.text, lineHeight: 1.5,
                transition: "color 0.5s ease",
              }}>
                {MOCK.plan.firstMove}
              </p>
            </div>

            {/* 30 / 60 / 90 */}
            {[
              { key: "day30", label: "Day 30", accent: t.amber, delay: "0s" },
              { key: "day60", label: "Day 60", accent: t.sage,  delay: "0.12s" },
              { key: "day90", label: "Day 90", accent: t.textDim, delay: "0.24s" },
            ].map(({ key, label, accent, delay }) => {
              const m = MOCK.plan[key];
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
                    <div style={{ fontSize: 13, color: accent, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
                    ✓ You'll know it's working when: {m.metric}
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
              {MOCK.plan.warning}
            </div>

            {/* Tip jar */}
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
                  {["$5", "$10", "$20", "Whatever feels right"].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setTipped(true)}
                      className="btn-primary"
                      style={{
                        background: t.amberBg, border: `1px solid ${t.amberBorder}`,
                        borderRadius: 8, color: t.amber, fontSize: 14,
                        padding: "10px 18px", cursor: "pointer",
                        transition: "all 0.25s ease",
                      }}
                      onMouseEnter={e => { e.target.style.background = t.amberBorder; }}
                      onMouseLeave={e => { e.target.style.background = t.amberBg; }}
                    >
                      {amt}
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
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: t.sage, marginBottom: 4 }}>
                  Appreciated. Genuinely.
                </div>
                <div style={{ fontSize: 13, color: t.muted }}>
                  This helps keep the analysis honest and the tool free.
                </div>
              </div>
            )}

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
                  Your plan is a snapshot. The world isn't.
                </div>
                <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.7, marginBottom: 20 }}>
                  Job market shifts. Sector signals change. New tools emerge.
                  We refresh your 30/60/90 monthly so your plan stays real.
                  Free for 30 days. No card.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                    onClick={() => email.includes("@") && setEmailDone(true)}
                    className="btn-primary"
                    style={{
                      background: t.btnPrimary, border: "none",
                      borderRadius: 8, color: t.btnPrimaryText,
                      fontSize: 14, fontWeight: 500, padding: "12px 22px",
                      cursor: "pointer", whiteSpace: "nowrap",
                      boxShadow: `0 4px 16px ${t.amberBg}`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    Keep my plan live →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: t.sageBg, border: `1px solid ${t.sageBorder}`,
                borderRadius: 12, padding: "20px 24px",
                transition: "all 0.5s ease",
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: t.sage, marginBottom: 4 }}>
                  You're in.
                </div>
                <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.7 }}>
                  First refresh arrives in 30 days. By then you'll have real data from your own moves.
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
// APP SHELL — Theme provider + screen router
// ============================================================
export default function Glitched() {
  const [isDark, setIsDark] = useState(true);
  const [screen, setScreen] = useState("landing");

  const t = isDark ? DARK : LIGHT;
  const toggle = () => setIsDark(d => !d);

  const bgPhase = { landing: "neutral", intake: "neutral", breathing: "breathing", plan: "plan" }[screen];

  return (
    <ThemeCtx.Provider value={{ t, isDark, toggle }}>
      <div style={{
        background: t.bg, minHeight: "100vh", color: t.text,
        transition: "background 0.5s ease, color 0.5s ease",
      }}>
        <GlobalStyle t={t} isDark={isDark} />
        <AmbientBg phase={bgPhase} />
        <ThemeToggle />

        {screen === "landing"   && <LandingScreen   onBegin={()    => setScreen("intake")} />}
        {screen === "intake"    && <IntakeScreen     onSubmit={()   => setScreen("breathing")} />}
        {screen === "breathing" && <BreathingScreen  onComplete={()=> setScreen("plan")} />}
        {screen === "plan"      && <PlanScreen />}
      </div>
    </ThemeCtx.Provider>
  );
}
