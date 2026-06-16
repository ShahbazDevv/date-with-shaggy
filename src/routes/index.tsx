import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import heroImg from "@/assets/hero-cutie.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Will You Go On A Date With Me? 💖" },
      { name: "description", content: "A playful little invitation just for you 🌸" },
      { property: "og:title", content: "Will You Go On A Date With Me? 💖" },
      { property: "og:description", content: "Open it. I dare you 😉" },
    ],
  }),
  component: DateInvite,
});

const STICKERS = ["💖", "✨", "🌸", "💕", "🎀", "💗", "🌷", "⭐", "🦄", "🍓", "🧁", "🌈"];

type Screen = 1 | 2 | 3;

// ---------- Sound engine (Web Audio API, no deps) ----------
type SoundName = "pop" | "boop" | "boing" | "sparkle" | "yay" | "swoosh";

function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const play = useCallback((name: SoundName = "pop") => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const tone = (
      freq: number,
      dur: number,
      type: OscillatorType = "sine",
      vol = 0.18,
      slideTo?: number,
      delay = 0,
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + delay + dur);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(vol, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    };

    switch (name) {
      case "pop":
        tone(680, 0.09, "triangle", 0.22, 320);
        break;
      case "boop":
        tone(520 + Math.random() * 120, 0.08, "sine", 0.18, 280);
        break;
      case "boing":
        tone(220, 0.18, "sawtooth", 0.18, 660);
        tone(330, 0.18, "triangle", 0.12, 880, 0.04);
        break;
      case "sparkle":
        [880, 1175, 1568].forEach((f, i) => tone(f, 0.12, "triangle", 0.14, f * 1.4, i * 0.05));
        break;
      case "yay":
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.2, undefined, i * 0.08));
        break;
      case "swoosh":
        tone(900, 0.25, "sine", 0.1, 200);
        break;
    }
  }, [ensureCtx]);

  return { play, ensureCtx };
}

// ---------- Floating stickers ----------
function FloatingStickers() {
  const items = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        emoji: STICKERS[i % STICKERS.length],
        left: (i * 53 + 7) % 100,
        top: (i * 37 + 11) % 100,
        delay: (i % 6) * 0.4,
        size: 26 + (i % 5) * 10,
        rotate: (i * 23) % 360,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {items.map((s, i) => (
        <motion.div
          key={i}
          className="absolute select-none drop-shadow-md"
          style={{ left: `${s.left}%`, top: `${s.top}%`, fontSize: s.size }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.35, 0.7, 0.35],
            y: [0, -30, 0],
            rotate: [s.rotate, s.rotate + 20, s.rotate - 10, s.rotate],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 5 + (i % 5),
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {s.emoji}
        </motion.div>
      ))}
    </div>
  );
}

function MusicToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.15, rotate: 10 }}
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      aria-label={playing ? "Mute music" : "Play music"}
      className="fixed top-4 right-4 z-50 grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-pink-400 text-2xl text-white shadow-xl"
    >
      <motion.span
        animate={playing ? { rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        {playing ? "🎵" : "🔇"}
      </motion.span>
    </motion.button>
  );
}

function burstConfetti(opts?: confetti.Options) {
  confetti({
    particleCount: 160,
    spread: 100,
    startVelocity: 50,
    origin: { y: 0.6 },
    colors: ["#FF1493", "#FF69B4", "#FFB6D9", "#FFD1DC", "#ffffff", "#FFEE58"],
    shapes: ["circle", "square"],
    scalar: 1.1,
    ...opts,
  });
}

function downloadICS(date: string, time24: string, day: string) {
  const dt = new Date(`${date}T${time24}:00`);
  const end = new Date(dt.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WillYouGoOnADate//EN",
    "BEGIN:VEVENT", `UID:${Date.now()}@date-invite`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(dt)}`, `DTEND:${fmt(end)}`, "SUMMARY:Our Date 💖",
    `DESCRIPTION:It's happening on ${day}!`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "our-date.ics"; a.click();
  URL.revokeObjectURL(url);
}

function DateInvite() {
  const [screen, setScreen] = useState<Screen>(1);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { play, ensureCtx } = useSounds();

  const startMusic = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.3;
    audioRef.current
      .play()
      .then(() => setMusicPlaying(true))
      .catch(() => {});
  }, []);

  // Auto-start music + audio context on FIRST user interaction anywhere
  useEffect(() => {
    const onFirst = () => {
      ensureCtx();
      if (!musicPlaying) startMusic();
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
    window.addEventListener("pointerdown", onFirst);
    window.addEventListener("keydown", onFirst);
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
  }, [musicPlaying, startMusic, ensureCtx]);

  // Funny click sound on EVERY button tap
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const btn = t.closest("button,select,input,a,[role=button]");
      if (!btn) return;
      const sound = (btn.getAttribute("data-sound") as SoundName) || "pop";
      play(sound);
    };
    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, [play]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      startMusic();
    }
  };

  // form state
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("7");
  const [minute, setMinute] = useState("00");
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("PM");
  const [day, setDay] = useState(
    ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date().getDay()],
  );
  const [errors, setErrors] = useState<{ date?: boolean; day?: boolean }>({});

  const time24 = (() => {
    let h = parseInt(hour, 10);
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute}`;
  })();

  const handleYes = () => {
    play("yay");
    startMusic();
    burstConfetti();
    setTimeout(() => {
      play("swoosh");
      setScreen(2);
    }, 700);
  };

  const handleSubmit = () => {
    const e: typeof errors = {};
    if (!date) e.date = true;
    if (!day) e.day = true;
    setErrors(e);
    if (Object.keys(e).length) {
      play("boing");
      return;
    }
    play("sparkle");
    burstConfetti();
    setTimeout(() => {
      play("swoosh");
      setScreen(3);
    }, 500);
  };

  useEffect(() => {
    if (screen !== 3) return;
    const id = setInterval(() => {
      confetti({
        particleCount: 8, startVelocity: 25, spread: 360,
        origin: { x: Math.random(), y: Math.random() * 0.3 },
        colors: ["#FF1493", "#FF69B4", "#FFB6D9", "#ffffff", "#FFEE58"],
        gravity: 0.6, scalar: 0.9,
      });
    }, 320);
    return () => clearInterval(id);
  }, [screen]);

  const formattedDate = date
    ? new Date(date + "T00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "";
  const dayLong = ({
    MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday",
    FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
  } as Record<string, string>)[day] ?? day;
  const timeLabel = `${parseInt(hour, 10)}:${minute} ${meridiem}`;

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, #FFD1DC 0%, transparent 50%), radial-gradient(circle at 80% 90%, #FFC0E5 0%, transparent 50%), linear-gradient(135deg, #FFE4F1 0%, #FFC8E0 50%, #FFB6D9 100%)",
      }}
    >
      <FloatingStickers />
      <MusicToggle playing={musicPlaying} onToggle={toggleMusic} />
      <audio
        ref={audioRef}
        loop
        src="https://cdn.pixabay.com/audio/2022/10/30/audio_347111d654.mp3"
      />

      <AnimatePresence mode="wait">
        {screen === 1 && <ScreenOne key="1" onYes={handleYes} />}
        {screen === 2 && (
          <ScreenTwo
            key="2"
            date={date} setDate={setDate}
            hour={hour} setHour={setHour}
            minute={minute} setMinute={setMinute}
            meridiem={meridiem} setMeridiem={setMeridiem}
            day={day} setDay={setDay}
            errors={errors} onSubmit={handleSubmit}
          />
        )}
        {screen === 3 && (
          <ScreenThree
            key="3"
            day={dayLong}
            dateLabel={formattedDate}
            timeLabel={timeLabel}
            onAddCalendar={() => downloadICS(date, time24, dayLong)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

const screenTransition = {
  initial: { opacity: 0, scale: 0.85, rotate: -4, y: 30 },
  animate: { opacity: 1, scale: 1, rotate: 0, y: 0 },
  exit: { opacity: 0, scale: 1.1, rotate: 4, y: -30 },
  transition: { type: "spring", stiffness: 120, damping: 16, mass: 0.8 },
};

function ScreenOne({ onYes }: { onYes: () => void }) {
  const [nudge, setNudge] = useState({ x: 0, y: 0, scale: 1 });
  const dodge = () => {
    setNudge({
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 200,
      scale: Math.max(0.4, nudge.scale * 0.85),
    });
    setTimeout(() => setNudge((n) => ({ ...n, x: 0, y: 0 })), 1200);
  };

  return (
    <motion.section
      {...screenTransition}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center"
    >
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6 h-[240px] w-[240px] overflow-hidden rounded-full border-[6px] border-white shadow-[0_20px_60px_-15px_rgba(255,20,147,0.6)]"
      >
        <img src={heroImg} alt="cute teddy with a heart" className="h-full w-full object-cover" />
      </motion.div>

      <motion.h1
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
        className="font-display max-w-2xl text-4xl font-black leading-tight sm:text-6xl"
        style={{
          color: "#C2185B",
          textShadow:
            "3px 3px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 4px 4px 0 #FF69B4",
        }}
      >
        WILL YOU GO ON A DATE WITH ME?
      </motion.h1>
      <motion.p
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-4 text-2xl tracking-[0.4em]"
      >
        🌸 🎀 💖 🎀 🌸
      </motion.p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <motion.button
          data-sound="yay"
          whileHover={{ scale: 1.15, rotate: [-2, 2, -2, 0] }}
          whileTap={{ scale: 0.9 }}
          animate={{ boxShadow: ["0 10px 30px rgba(255,20,147,0.5)", "0 15px 45px rgba(255,20,147,0.8)", "0 10px 30px rgba(255,20,147,0.5)"] }}
          transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
          onClick={onYes}
          className="font-display rounded-[30px] bg-gradient-to-br from-[#FF69B4] to-[#FF1493] px-12 py-5 text-2xl font-black text-white"
        >
          YES!! 💖
        </motion.button>

        <motion.button
          data-sound="boing"
          animate={nudge}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
          onMouseEnter={dodge}
          onClick={dodge}
          className="font-display rounded-[30px] border-[3px] border-[#FF1493] bg-white px-8 py-4 text-lg font-black text-[#FF1493]"
        >
          No 😢
        </motion.button>
      </div>

      <p className="font-marker mt-12 text-base text-[#C2185B]">
        psst… one answer is correct ✨
      </p>
    </motion.section>
  );
}

type S2Props = {
  date: string; setDate: (v: string) => void;
  hour: string; setHour: (v: string) => void;
  minute: string; setMinute: (v: string) => void;
  meridiem: "AM" | "PM"; setMeridiem: (v: "AM" | "PM") => void;
  day: string; setDay: (v: string) => void;
  errors: { date?: boolean; day?: boolean };
  onSubmit: () => void;
};

function ScreenTwo(p: S2Props) {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ["00", "15", "30", "45"];

  return (
    <motion.section
      {...screenTransition}
      className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12"
    >
      <motion.h1
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150 }}
        className="font-display text-center text-4xl font-black sm:text-6xl"
        style={{
          color: "#C2185B",
          textShadow: "2px 2px 0 #fff, 4px 4px 0 #FF69B4",
        }}
      >
        WHEN&apos;S GOOD? 📅
      </motion.h1>
      <p className="font-marker mt-3 text-base text-[#C2185B]">tell me the date, time &amp; day ✨</p>

      <div className="mt-10 grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        <Card error={p.errors.date} emoji="🗓️" label="PICK A DATE">
          <input
            data-sound="boop"
            type="date"
            value={p.date}
            onChange={(e) => p.setDate(e.target.value)}
            className="font-body w-full rounded-xl border-2 border-pink-300 bg-white px-3 py-3 text-base text-[#1a1a1a] focus:border-[#FF1493] focus:outline-none"
          />
        </Card>

        <Card emoji="⏰" label="WHAT TIME?">
          <div className="flex items-center gap-2">
            <select
              data-sound="boop"
              value={p.hour}
              onChange={(e) => p.setHour(e.target.value)}
              className="font-body flex-1 rounded-xl border-2 border-pink-300 bg-white px-2 py-3 text-center focus:border-[#FF1493] focus:outline-none"
            >
              {hours.map((h) => <option key={h}>{h}</option>)}
            </select>
            <span className="font-display text-2xl">:</span>
            <select
              data-sound="boop"
              value={p.minute}
              onChange={(e) => p.setMinute(e.target.value)}
              className="font-body flex-1 rounded-xl border-2 border-pink-300 bg-white px-2 py-3 text-center focus:border-[#FF1493] focus:outline-none"
            >
              {minutes.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            {(["AM", "PM"] as const).map((m) => (
              <motion.button
                key={m}
                data-sound="pop"
                whileTap={{ scale: 0.9 }}
                onClick={() => p.setMeridiem(m)}
                className={`font-display flex-1 rounded-xl border-2 py-2 text-sm font-black transition ${
                  p.meridiem === m
                    ? "border-[#FF1493] bg-[#FF1493] text-white"
                    : "border-pink-300 bg-white text-[#FF1493]"
                }`}
              >
                {m}
              </motion.button>
            ))}
          </div>
        </Card>

        <Card error={p.errors.day} emoji="📍" label="WHICH DAY?">
          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <motion.button
                key={d}
                data-sound="pop"
                whileTap={{ scale: 0.85, rotate: -8 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => p.setDay(d)}
                className={`font-display rounded-[20px] border-2 px-3 py-2 text-xs font-black transition ${
                  p.day === d
                    ? "border-[#FF1493] bg-[#FF1493] text-white"
                    : "border-pink-300 bg-white text-[#FF1493] hover:border-[#FF1493]"
                }`}
              >
                {d}
              </motion.button>
            ))}
          </div>
        </Card>
      </div>

      <motion.button
        data-sound="sparkle"
        whileHover={{ scale: 1.08, y: -3 }}
        whileTap={{ scale: 0.92 }}
        animate={{ boxShadow: ["0 10px 30px rgba(255,20,147,0.5)", "0 18px 50px rgba(255,20,147,0.8)", "0 10px 30px rgba(255,20,147,0.5)"] }}
        transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
        onClick={p.onSubmit}
        className="font-display mt-10 w-full max-w-xs rounded-[30px] bg-gradient-to-br from-[#FF69B4] to-[#FF1493] py-5 text-2xl font-black text-white"
      >
        LET&apos;S GO! 💖
      </motion.button>
    </motion.section>
  );
}

function Card({
  emoji, label, error, children,
}: { emoji: string; label: string; error?: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      animate={error ? { x: [-10, 10, -8, 8, 0], rotate: [-2, 2, -1, 1, 0] } : {}}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, rotate: 0.5 }}
      className="relative rounded-2xl border-[3px] border-[#FF1493] bg-white p-5 shadow-[0_8px_24px_-8px_rgba(255,20,147,0.4)]"
    >
      {error && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl"
        >
          😭
        </motion.div>
      )}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="font-display text-sm font-black tracking-wide text-[#C2185B]">{label}</span>
      </div>
      {children}
    </motion.div>
  );
}

function ScreenThree({
  day, dateLabel, timeLabel, onAddCalendar,
}: { day: string; dateLabel: string; timeLabel: string; onAddCalendar: () => void }) {
  return (
    <motion.section
      {...screenTransition}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className="mb-6 h-[240px] w-[240px] overflow-hidden rounded-full border-[6px] border-white shadow-[0_20px_60px_-15px_rgba(255,20,147,0.7)]"
      >
        <motion.img
          src={heroImg} alt="yay"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-full w-full object-cover"
        />
      </motion.div>

      <motion.h1
        animate={{ scale: [1, 1.08, 1], rotate: [-1, 1, -1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="font-display text-5xl font-black sm:text-7xl"
        style={{
          color: "#C2185B",
          textShadow: "3px 3px 0 #fff, 6px 6px 0 #FF69B4",
        }}
      >
        IT&apos;S A DATE!! 💖
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 max-w-md text-xl"
      >
        <span className="font-display font-black text-[#C2185B]">
          {day}, {dateLabel} at {timeLabel}
        </span>
      </motion.p>
      <p className="font-marker mt-2 text-base text-[#C2185B]">see you soon 🌸</p>

      <motion.button
        data-sound="sparkle"
        whileHover={{ scale: 1.08, rotate: [-2, 2, 0] }}
        whileTap={{ scale: 0.92 }}
        onClick={onAddCalendar}
        className="font-display mt-10 rounded-[30px] border-[3px] border-[#FF1493] bg-white px-8 py-4 text-lg font-black text-[#FF1493] shadow-lg hover:bg-pink-50"
      >
        ADD TO CALENDAR 📲
      </motion.button>

      <p className="font-marker mt-12 text-sm text-[#C2185B]">sent with 💖</p>
    </motion.section>
  );
}
