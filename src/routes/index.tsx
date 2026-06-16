import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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

const STICKERS = ["💖", "✨", "🌸", "💕", "🎀", "💗", "🌷", "⭐"];
const HERO_IMG =
  "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=500&h=500&fit=crop";

type Screen = 1 | 2 | 3;

function FloatingStickers() {
  const items = Array.from({ length: 18 }, (_, i) => ({
    emoji: STICKERS[i % STICKERS.length],
    left: (i * 53) % 100,
    top: (i * 37) % 100,
    delay: (i % 6) * 0.4,
    size: 28 + (i % 4) * 10,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {items.map((s, i) => (
        <motion.div
          key={i}
          className="absolute select-none"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: s.size,
            opacity: 0.3,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.2, 0.45, 0.2],
            y: [0, -25, 0],
            rotate: [0, 12, -6, 0],
          }}
          transition={{
            duration: 6 + (i % 5),
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
    <button
      onClick={onToggle}
      aria-label={playing ? "Mute music" : "Play music"}
      className="fixed top-4 right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-white/90 text-2xl shadow-lg backdrop-blur transition hover:scale-110"
    >
      {playing ? "🎵" : "🔇"}
    </button>
  );
}

function burstConfetti(opts?: confetti.Options) {
  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: ["#FF69B4", "#FF1493", "#FFB6D9", "#FFC0CB", "#ffffff"],
    ...opts,
  });
}

function downloadICS(date: string, time24: string, day: string) {
  const dt = new Date(`${date}T${time24}:00`);
  const end = new Date(dt.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WillYouGoOnADate//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@date-invite`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(dt)}`,
    `DTEND:${fmt(end)}`,
    "SUMMARY:Our Date 💖",
    `DESCRIPTION:It's happening on ${day}!`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "our-date.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function DateInvite() {
  const [screen, setScreen] = useState<Screen>(1);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ensureMusic = () => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.35;
    audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      ensureMusic();
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
    ensureMusic();
    burstConfetti();
    setTimeout(() => setScreen(2), 600);
  };

  const handleSubmit = () => {
    const e: typeof errors = {};
    if (!date) e.date = true;
    if (!day) e.day = true;
    setErrors(e);
    if (Object.keys(e).length) return;
    burstConfetti();
    setTimeout(() => setScreen(3), 400);
  };

  useEffect(() => {
    if (screen !== 3) return;
    const id = setInterval(() => {
      confetti({
        particleCount: 6,
        startVelocity: 25,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() * 0.3 },
        colors: ["#FF69B4", "#FF1493", "#FFB6D9", "#ffffff"],
        gravity: 0.6,
        scalar: 0.9,
      });
    }, 350);
    return () => clearInterval(id);
  }, [screen]);

  const formattedDate = date
    ? new Date(date + "T00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "";
  const dayLong = {
    MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday",
    FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
  }[day];
  const timeLabel = `${parseInt(hour, 10)}:${minute} ${meridiem}`;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <FloatingStickers />
      <MusicToggle playing={musicPlaying} onToggle={toggleMusic} />
      <audio
        ref={audioRef}
        loop
        src="https://cdn.pixabay.com/audio/2022/10/30/audio_347111d654.mp3"
      />

      <AnimatePresence mode="wait">
        {screen === 1 && (
          <ScreenOne key="1" onYes={handleYes} />
        )}
        {screen === 2 && (
          <ScreenTwo
            key="2"
            date={date}
            setDate={setDate}
            hour={hour}
            setHour={setHour}
            minute={minute}
            setMinute={setMinute}
            meridiem={meridiem}
            setMeridiem={setMeridiem}
            day={day}
            setDay={setDay}
            errors={errors}
            onSubmit={handleSubmit}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6 h-[250px] w-[250px] overflow-hidden rounded-full border-[5px] border-white shadow-2xl"
      >
        <img src={HERO_IMG} alt="hi 🌸" className="h-full w-full object-cover" />
      </motion.div>

      <h1 className="font-display max-w-2xl text-4xl font-bold leading-tight text-[#1a1a1a] sm:text-5xl">
        WILL YOU GO ON A DATE WITH ME?
      </h1>
      <p className="mt-4 text-2xl tracking-[0.4em]">🌸 🎀 💖 🎀 🌸</p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1, rotate: [-1, 1, -1, 0] }}
          whileTap={{ scale: 0.92 }}
          onClick={onYes}
          className="font-display rounded-[25px] bg-[#FF69B4] px-10 py-4 text-xl font-bold text-white shadow-lg shadow-pink-400/50 transition hover:bg-[#FF1493]"
        >
          YES!! 💖
        </motion.button>

        <motion.button
          animate={nudge}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
          onMouseEnter={dodge}
          onClick={dodge}
          className="font-display rounded-[25px] border-2 border-[#FF69B4] bg-white px-8 py-4 text-lg font-bold text-[#FF69B4]"
        >
          MAYBE LATER
        </motion.button>
      </div>

      <p className="font-marker mt-12 text-sm text-pink-700/70">
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12"
    >
      <h1 className="font-display text-center text-4xl font-bold sm:text-5xl">
        WHEN&apos;S GOOD? 📅
      </h1>
      <p className="mt-3 text-sm text-gray-600">tell me the date, time &amp; day</p>

      <div className="mt-10 grid w-full grid-cols-1 gap-5 md:grid-cols-3">
        <Card error={p.errors.date} emoji="🗓️" label="PICK A DATE">
          <input
            type="date"
            value={p.date}
            onChange={(e) => p.setDate(e.target.value)}
            className="font-body w-full rounded-xl border-2 border-pink-200 bg-white px-3 py-3 text-base text-[#1a1a1a] focus:border-[#FF69B4] focus:outline-none"
          />
        </Card>

        <Card emoji="⏰" label="WHAT TIME?">
          <div className="flex items-center gap-2">
            <select
              value={p.hour}
              onChange={(e) => p.setHour(e.target.value)}
              className="font-body flex-1 rounded-xl border-2 border-pink-200 bg-white px-2 py-3 text-center focus:border-[#FF69B4] focus:outline-none"
            >
              {hours.map((h) => <option key={h}>{h}</option>)}
            </select>
            <span className="font-display text-2xl">:</span>
            <select
              value={p.minute}
              onChange={(e) => p.setMinute(e.target.value)}
              className="font-body flex-1 rounded-xl border-2 border-pink-200 bg-white px-2 py-3 text-center focus:border-[#FF69B4] focus:outline-none"
            >
              {minutes.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            {(["AM", "PM"] as const).map((m) => (
              <button
                key={m}
                onClick={() => p.setMeridiem(m)}
                className={`font-display flex-1 rounded-xl border-2 py-2 text-sm font-bold transition ${
                  p.meridiem === m
                    ? "border-[#FF69B4] bg-[#FF69B4] text-white"
                    : "border-pink-200 bg-white text-[#FF69B4]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Card>

        <Card error={p.errors.day} emoji="📍" label="WHICH DAY?">
          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => p.setDay(d)}
                className={`font-display rounded-[20px] border-2 px-3 py-2 text-xs font-bold transition ${
                  p.day === d
                    ? "border-[#FF69B4] bg-[#FF69B4] text-white"
                    : "border-pink-200 bg-white text-[#FF69B4] hover:border-[#FF69B4]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={p.onSubmit}
        className="font-display mt-10 w-full max-w-xs rounded-[25px] bg-[#FF69B4] py-4 text-xl font-bold text-white shadow-lg shadow-pink-400/50 hover:bg-[#FF1493]"
      >
        LET&apos;S GO! 💖
      </motion.button>
    </motion.section>
  );
}

function Card({
  emoji,
  label,
  error,
  children,
}: {
  emoji: string;
  label: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      animate={error ? { x: [-8, 8, -6, 6, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border-2 border-[#FF69B4] bg-white p-5 shadow-md transition hover:shadow-pink-400/50 hover:shadow-xl"
    >
      {error && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">😭</div>
      )}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="font-display text-sm font-bold tracking-wide">{label}</span>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="mb-6 h-[250px] w-[250px] overflow-hidden rounded-full border-[5px] border-white shadow-2xl"
      >
        <img src={HERO_IMG} alt="yay" className="h-full w-full object-cover" />
      </motion.div>

      <h1 className="font-display text-5xl font-bold text-[#FF1493] drop-shadow-sm sm:text-6xl">
        IT&apos;S A DATE!! 💖
      </h1>

      <p className="mt-6 max-w-md text-lg text-[#1a1a1a]">
        <span className="font-display font-bold text-[#FF69B4]">
          {day}, {dateLabel} at {timeLabel}
        </span>
      </p>
      <p className="mt-2 text-sm text-gray-600">see you soon 🌸</p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddCalendar}
        className="font-display mt-10 rounded-[25px] border-2 border-[#FF69B4] bg-white px-8 py-4 text-base font-bold text-[#FF69B4] hover:bg-pink-50"
      >
        ADD TO CALENDAR 📲
      </motion.button>

      <p className="font-marker mt-12 text-xs text-pink-700/70">
        sent with 💖
      </p>
    </motion.section>
  );
}
