import React, { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  Check,
  CloudRain,
  Coffee,
  Copy,
  FileText,
  Flame,
  Pause,
  Play,
  Quote,
  RotateCcw,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookPlaceholder } from "@/components/ReaderArt";
import { useBooks } from "@/context/BooksContext";

type TimerPreset = 15 | 25 | 45 | 0; // 0 = open stopwatch
type SoundKey = "rain" | "fire" | "cafe";
type RightTab = "capture" | "jar";

type QuoteMoment = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  text: string;
  page?: number | undefined;
  minutesLogged?: number | undefined;
  createdAt: number;
};

type BookPageProgress = {
  currentPage: number;
  totalPages: number;
};

type SanctuaryStore = {
  goalMinutes: number;
  dailyMinutes: Record<string, number>;
  quotes: QuoteMoment[];
  pageProgress: Record<string, BookPageProgress>;
};

const STORAGE_KEY = "book-nook-sanctuary-v1";

const DEFAULT_STORE: SanctuaryStore = {
  goalMinutes: 20,
  dailyMinutes: {},
  quotes: [],
  pageProgress: {},
};

const GOAL_OPTIONS = [15, 20, 30, 45] as const;

const SOUND_CHANNELS: {
  key: SoundKey;
  label: string;
  desc: string;
  icon: typeof CloudRain;
}[] = [
  { key: "rain", label: "Rain", desc: "Soft window rain", icon: CloudRain },
  { key: "fire", label: "Hearth", desc: "Warm fire crackle", icon: Flame },
  { key: "cafe", label: "Bookshop", desc: "Velvet ambient hum", icon: Coffee },
];

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type AudioEngine = {
  ctx: AudioContext;
  masterGain: GainNode;
  channels: Record<SoundKey, GainNode>;
};

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLast7Days(today: Date): { key: string; shortLabel: string; isToday: boolean }[] {
  const days: { key: string; shortLabel: string; isToday: boolean }[] = [];
  const weekdayNames = ["Su", "M", "T", "W", "T", "F", "S"];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    days.push({
      key: toLocalDateKey(dt),
      shortLabel: weekdayNames[dt.getDay()] ?? "",
      isToday: offset === 0,
    });
  }
  return days;
}

function computeStreak(dailyMinutes: Record<string, number>, today: Date): number {
  const todayKey = toLocalDateKey(today);
  const startOffset = (dailyMinutes[todayKey] ?? 0) > 0 ? 0 : 1;
  let streak = 0;
  for (let i = startOffset; i < 365; i += 1) {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = toLocalDateKey(dt);
    if ((dailyMinutes[key] ?? 0) > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.floor(Math.max(0, totalSeconds) % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function makeLoopableNoiseBuffer(
  ctx: AudioContext,
  seconds: number,
  mode: "pink" | "brown" | "crackle",
): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let brown = 0;

  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    if (mode === "pink") {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
    } else if (mode === "brown") {
      brown = (brown + 0.025 * white) / 1.025;
      data[i] = brown * 2.4;
    } else {
      // Sparse soft ember crackle
      const pop = Math.random() > 0.9965 ? (Math.random() * 2 - 1) * 0.75 : 0;
      brown = brown * 0.92 + pop;
      data[i] = brown * 0.45;
    }
  }

  // Smooth crossfade at loop seam to avoid clicks
  const seam = Math.min(Math.floor(ctx.sampleRate * 0.04), Math.floor(length / 8));
  for (let i = 0; i < seam; i += 1) {
    const alpha = i / seam;
    const tailIdx = length - seam + i;
    const blended = (data[i] ?? 0) * alpha + (data[tailIdx] ?? 0) * (1 - alpha);
    data[i] = blended;
    data[tailIdx] = blended;
  }

  return buffer;
}

function createAudioEngine(initialVolume: number): AudioEngine | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.value = initialVolume;
  masterGain.connect(ctx.destination);

  // Rain channel: filtered pink noise
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0;
  const rainFilter = ctx.createBiquadFilter();
  rainFilter.type = "bandpass";
  rainFilter.frequency.value = 920;
  rainFilter.Q.value = 0.65;
  const rainSrc = ctx.createBufferSource();
  rainSrc.buffer = makeLoopableNoiseBuffer(ctx, 5, "pink");
  rainSrc.loop = true;
  rainSrc.connect(rainFilter);
  rainFilter.connect(rainGain);
  rainGain.connect(masterGain);
  rainSrc.start();

  // Hearth channel: warm low rumble + soft crackles
  const fireGain = ctx.createGain();
  fireGain.gain.value = 0;
  const fireLow = ctx.createBiquadFilter();
  fireLow.type = "lowpass";
  fireLow.frequency.value = 180;
  const fireRumble = ctx.createBufferSource();
  fireRumble.buffer = makeLoopableNoiseBuffer(ctx, 5, "brown");
  fireRumble.loop = true;
  fireRumble.connect(fireLow);
  fireLow.connect(fireGain);

  const crackleBp = ctx.createBiquadFilter();
  crackleBp.type = "bandpass";
  crackleBp.frequency.value = 1850;
  crackleBp.Q.value = 1.4;
  const crackleSrc = ctx.createBufferSource();
  crackleSrc.buffer = makeLoopableNoiseBuffer(ctx, 6, "crackle");
  crackleSrc.loop = true;
  crackleSrc.connect(crackleBp);
  crackleBp.connect(fireGain);
  fireGain.connect(masterGain);
  fireRumble.start();
  crackleSrc.start();

  // Bookshop / Velvet brown channel
  const cafeGain = ctx.createGain();
  cafeGain.gain.value = 0;
  const cafeFilter = ctx.createBiquadFilter();
  cafeFilter.type = "lowpass";
  cafeFilter.frequency.value = 420;
  const cafeSrc = ctx.createBufferSource();
  cafeSrc.buffer = makeLoopableNoiseBuffer(ctx, 5, "brown");
  cafeSrc.loop = true;
  cafeSrc.connect(cafeFilter);
  cafeFilter.connect(cafeGain);
  cafeGain.connect(masterGain);
  cafeSrc.start();

  return {
    ctx,
    masterGain,
    channels: {
      rain: rainGain,
      fire: fireGain,
      cafe: cafeGain,
    },
  };
}

function playGentleChime() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.7);
    });
    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 1500);
  } catch {
    // ignore browser audio restriction
  }
}

export function ReadingSanctuary() {
  const { books, currentBook, openPdf, setEditingBook } = useBooks();

  const [store, setStore] = useState<SanctuaryStore>(DEFAULT_STORE);
  const [hydrated, setHydrated] = useState(false);
  const [todayDate, setTodayDate] = useState<Date | null>(null);

  // Selected book defaults to currentBook if unset
  const [pickedBookId, setPickedBookId] = useState<string>("");

  // Focus timer state
  const [preset, setPreset] = useState<TimerPreset>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const lastTickRef = useRef<number | null>(null);

  // Ambient Web Audio soundscape state
  const [activeSounds, setActiveSounds] = useState<Record<SoundKey, boolean>>({
    rain: false,
    fire: false,
    cafe: false,
  });
  const [volume, setVolume] = useState<number>(0.55);
  const engineRef = useRef<AudioEngine | null>(null);

  // Habit & Quote capture state
  const [rightTab, setRightTab] = useState<RightTab>("capture");
  const [quoteText, setQuoteText] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [totalPagesInput, setTotalPagesInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active book resolution
  const activeBook = useMemo(() => {
    if (pickedBookId) {
      const found = books.find((b) => b.id === pickedBookId);
      if (found) return found;
    }
    return currentBook ?? books[0] ?? null;
  }, [books, currentBook, pickedBookId]);

  const selectableBooks = useMemo(() => {
    const activeFirst = books.filter((b) => b.status !== "Completed");
    const doneRest = books.filter((b) => b.status === "Completed");
    return [...activeFirst, ...doneRest];
  }, [books]);

  // Hydrate persisted Sanctuary data safely on client only (prevents SSR mismatch)
  useEffect(() => {
    setTodayDate(new Date());
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SanctuaryStore>;
        setStore({
          goalMinutes:
            typeof parsed.goalMinutes === "number" && parsed.goalMinutes >= 5
              ? parsed.goalMinutes
              : 20,
          dailyMinutes: parsed.dailyMinutes ?? {},
          quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
          pageProgress: parsed.pageProgress ?? {},
        });
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  // Sync page inputs when switching active book
  useEffect(() => {
    if (!hydrated || !activeBook) return;
    const saved = store.pageProgress[activeBook.id];
    setPageInput(saved?.currentPage ? String(saved.currentPage) : "");
    setTotalPagesInput(saved?.totalPages ? String(saved.totalPages) : "");
  }, [activeBook, hydrated, store.pageProgress]);

  // Save store changes after client hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore quota limits
    }
  }, [hydrated, store]);

  // Helper to log minutes into today's tracker
  const logMinutesToToday = (minutes: number) => {
    if (minutes <= 0) return;
    const key = toLocalDateKey(new Date());
    setStore((prev) => ({
      ...prev,
      dailyMinutes: {
        ...prev.dailyMinutes,
        [key]: (prev.dailyMinutes[key] ?? 0) + minutes,
      },
    }));
  };

  // Wall-clock accurate timer loop
  useEffect(() => {
    if (!isRunning) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const prev = lastTickRef.current ?? now;
      const elapsedSec = Math.floor((now - prev) / 1000);
      if (elapsedSec <= 0) return;
      lastTickRef.current = prev + elapsedSec * 1000;

      if (preset === 0) {
        setStopwatchSeconds((s) => s + elapsedSec);
      } else {
        setSecondsLeft((s) => {
          const next = s - elapsedSec;
          if (next <= 0) {
            setIsRunning(false);
            playGentleChime();
            const earnedMinutes = preset;
            const key = toLocalDateKey(new Date());
            setStore((cur) => ({
              ...cur,
              dailyMinutes: {
                ...cur.dailyMinutes,
                [key]: (cur.dailyMinutes[key] ?? 0) + earnedMinutes,
              },
            }));
            toast.success(`${earnedMinutes}m reading sprint complete!`, {
              description: activeBook
                ? `Logged toward your daily goal with ${activeBook.title}.`
                : "Added to today's reading streak.",
            });
            return preset * 60;
          }
          return next;
        });
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isRunning, preset, activeBook]);

  // Ambient audio teardown on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        void engineRef.current.ctx.close().catch(() => undefined);
        engineRef.current = null;
      }
    };
  }, []);

  // Update master volume when slider moves
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.masterGain.gain.setTargetAtTime(volume, eng.ctx.currentTime, 0.05);
  }, [volume]);

  const selectPreset = (nextPreset: TimerPreset) => {
    setIsRunning(false);
    setPreset(nextPreset);
    if (nextPreset === 0) {
      setStopwatchSeconds(0);
    } else {
      setSecondsLeft(nextPreset * 60);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (preset === 0) {
      setStopwatchSeconds(0);
    } else {
      setSecondsLeft(preset * 60);
    }
  };

  const elapsedMinutesInSession = useMemo(() => {
    if (preset === 0) {
      return Math.floor(stopwatchSeconds / 60);
    }
    const elapsed = preset * 60 - secondsLeft;
    return Math.floor(elapsed / 60);
  }, [preset, secondsLeft, stopwatchSeconds]);

  const finishAndLogTimer = () => {
    const rawMinutes =
      preset === 0
        ? Math.max(1, Math.round(stopwatchSeconds / 60))
        : Math.max(1, Math.round((preset * 60 - secondsLeft) / 60));
    logMinutesToToday(rawMinutes);
    resetTimer();
    toast.success(`Logged ${rawMinutes} min of reading!`, {
      description: activeBook ? `Great progress on ${activeBook.title}.` : "Daily streak updated.",
    });
  };

  const toggleSound = async (key: SoundKey) => {
    const nextVal = !activeSounds[key];
    const nextState = { ...activeSounds, [key]: nextVal };

    if (!engineRef.current) {
      engineRef.current = createAudioEngine(volume);
    }
    const eng = engineRef.current;
    if (!eng) {
      toast.error("Audio unavailable in this browser");
      return;
    }

    if (eng.ctx.state === "suspended") {
      try {
        await eng.ctx.resume();
      } catch {
        // ignore
      }
    }

    const channelGains: Record<SoundKey, number> = {
      rain: 0.72,
      fire: 0.78,
      cafe: 0.62,
    };

    eng.channels[key].gain.setTargetAtTime(
      nextVal ? channelGains[key] : 0,
      eng.ctx.currentTime,
      0.12,
    );
    setActiveSounds(nextState);
  };

  const muteAllSounds = () => {
    const eng = engineRef.current;
    if (eng) {
      (Object.keys(eng.channels) as SoundKey[]).forEach((k) => {
        eng.channels[k].gain.setTargetAtTime(0, eng.ctx.currentTime, 0.08);
      });
    }
    setActiveSounds({ rain: false, fire: false, cafe: false });
  };

  const anySoundActive = activeSounds.rain || activeSounds.fire || activeSounds.cafe;

  const todayKey = todayDate ? toLocalDateKey(todayDate) : "";
  const todayMinutes = todayKey ? (store.dailyMinutes[todayKey] ?? 0) : 0;
  const last7Days = useMemo(() => (todayDate ? getLast7Days(todayDate) : []), [todayDate]);
  const streak = useMemo(
    () => (todayDate ? computeStreak(store.dailyMinutes, todayDate) : 0),
    [store.dailyMinutes, todayDate],
  );

  const goalPct = Math.min(100, Math.round((todayMinutes / Math.max(1, store.goalMinutes)) * 100));

  // Progress ring math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const ringProgress =
    preset === 0
      ? (stopwatchSeconds % 60) / 60
      : Math.max(0, Math.min(1, secondsLeft / (preset * 60)));
  const strokeOffset = circumference * (1 - ringProgress);

  const activeBookProgress = activeBook ? store.pageProgress[activeBook.id] : undefined;
  const activeBookPct =
    activeBookProgress && activeBookProgress.totalPages > 0
      ? Math.min(
          100,
          Math.round((activeBookProgress.currentPage / activeBookProgress.totalPages) * 100),
        )
      : null;

  const handleSaveMoment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeBook) {
      toast.error("Add a book to your shelf first!");
      return;
    }

    const parsedPage = Number.parseInt(pageInput, 10);
    const parsedTotal = Number.parseInt(totalPagesInput, 10);
    const hasValidPages = !Number.isNaN(parsedPage) && parsedPage >= 0;
    const trimmedQuote = quoteText.trim();

    if (!trimmedQuote && !hasValidPages) {
      toast.info("Enter a page number or a favorite quote to save.");
      return;
    }

    setStore((prev) => {
      const nextProgress = { ...prev.pageProgress };
      if (hasValidPages) {
        const existing = nextProgress[activeBook.id];
        nextProgress[activeBook.id] = {
          currentPage: parsedPage,
          totalPages:
            !Number.isNaN(parsedTotal) && parsedTotal > 0
              ? parsedTotal
              : (existing?.totalPages ?? 0),
        };
      }

      const nextQuotes = trimmedQuote
        ? [
            {
              id: crypto.randomUUID(),
              bookId: activeBook.id,
              bookTitle: activeBook.title,
              bookAuthor: activeBook.author,
              text: trimmedQuote,
              page: hasValidPages ? parsedPage : undefined,
              createdAt: Date.now(),
            },
            ...prev.quotes,
          ]
        : prev.quotes;

      return {
        ...prev,
        pageProgress: nextProgress,
        quotes: nextQuotes,
      };
    });

    if (trimmedQuote) {
      setQuoteText("");
      setRightTab("jar");
      toast.success("Quote tucked into your Quote Jar!");
    } else {
      toast.success(`Bookmark saved at page ${parsedPage}!`);
    }
  };

  const handleCopyQuote = async (q: QuoteMoment) => {
    const formatted = `“${q.text}” — ${q.bookTitle} by ${q.bookAuthor}${q.page ? ` (p. ${q.page})` : ""}`;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedId(q.id);
      toast.success("Quote copied!");
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast.error("Clipboard blocked by browser");
    }
  };

  const handleDeleteQuote = (id: string) => {
    setStore((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.id !== id),
    }));
  };

  return (
    <section className="dds-yellow-band pt-6 pb-10 md:pb-12">
      <div className="dds-container">
        <div className="text-center max-w-2xl mx-auto mb-7">
          <span className="dds-kicker-chip mb-2.5 bg-white">
            <Sparkles size={13} /> COZY FOCUS DESK
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#103A4E] tracking-tight">
            Reading Sanctuary & Quote Jar
          </h2>
          <p className="text-xs sm:text-sm font-bold text-[#103A4E]/75 mt-1.5 leading-relaxed">
            Start a focused chapter sprint, layer rainy-window ambiance, track your daily streak,
            and save favorite lines & page bookmarks.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT PANEL: FOCUS TIMER + SOUNDSCAPE MIXER */}
          <article className="lg:col-span-6 dds-sanctuary-card">
            {/* Active Book Bar */}
            <div className="dds-sanctuary-bookbar">
              <div className="w-11 h-15 rounded-xl overflow-hidden bg-[#DFF5F9] border border-[#103A4E]/15 shrink-0">
                {activeBook?.cover && !activeBook.loading ? (
                  <img
                    src={activeBook.cover}
                    alt={activeBook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookPlaceholder title={activeBook?.title ?? "Book Nook"} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <label className="block">
                  <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-[#F47A3C] block mb-0.5">
                    Reading Session For
                  </span>
                  <select
                    aria-label="Choose book for reading session"
                    value={activeBook?.id ?? ""}
                    onChange={(e) => setPickedBookId(e.target.value)}
                    className="w-full bg-white border border-[#103A4E]/15 rounded-full px-3 py-1 text-xs font-extrabold text-[#103A4E] truncate cursor-pointer focus:outline-none focus:border-[#4DC4D8]"
                  >
                    {selectableBooks.length > 0 ? (
                      selectableBooks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} — {b.author}
                        </option>
                      ))
                    ) : (
                      <option value="">Add a book to track sessions</option>
                    )}
                  </select>
                </label>

                {activeBookPct !== null && activeBookProgress && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#103A4E]/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#4DC4D8] transition-all"
                        style={{ width: `${activeBookPct}%` }}
                      />
                    </div>
                    <span className="text-[0.66rem] font-extrabold text-[#103A4E]/75 shrink-0">
                      p. {activeBookProgress.currentPage}/{activeBookProgress.totalPages} (
                      {activeBookPct}%)
                    </span>
                  </div>
                )}
              </div>

              {activeBook && (
                <div className="flex flex-col gap-1 shrink-0">
                  {activeBook.hasPdf && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void openPdf(activeBook.id)}
                      className="h-7 px-2.5 rounded-full bg-[#FCE172] hover:bg-[#f7d44c] text-[#103A4E] text-[0.68rem] font-extrabold"
                    >
                      <FileText size={12} className="mr-1" /> PDF
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingBook(activeBook)}
                    className="h-7 px-2.5 rounded-full bg-white border border-[#103A4E]/15 text-[#103A4E] text-[0.68rem] font-extrabold hover:bg-[#DFF5F9]"
                  >
                    <BookOpen size={12} className="mr-1" /> Info
                  </Button>
                </div>
              )}
            </div>

            {/* Timer Preset Pills + Ring Dial */}
            <div className="flex flex-col items-center py-4">
              <div
                className="flex flex-wrap justify-center gap-1.5 mb-4"
                role="group"
                aria-label="Timer duration presets"
              >
                {(
                  [
                    { val: 15, label: "15m Quick" },
                    { val: 25, label: "25m Cozy" },
                    { val: 45, label: "45m Deep" },
                    { val: 0, label: "Stopwatch" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => selectPreset(item.val)}
                    className={`dds-sanctuary-chip ${preset === item.val ? "is-active" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Circular Clock Dial */}
              <div className="relative w-[156px] h-[156px] flex items-center justify-center mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 152 152" aria-hidden="true">
                  <circle
                    cx="76"
                    cy="76"
                    r={radius}
                    fill="#FAF5E8"
                    stroke="#ECE2CD"
                    strokeWidth="10"
                  />
                  <circle
                    cx="76"
                    cy="76"
                    r={radius}
                    fill="none"
                    stroke={isRunning ? "#F47A3C" : "#4DC4D8"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    className="transition-[stroke-dashoffset] duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display font-bold text-3xl text-[#103A4E] tabular-nums tracking-tight">
                    {formatClock(preset === 0 ? stopwatchSeconds : secondsLeft)}
                  </span>
                  <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#103A4E]/60 mt-0.5">
                    {isRunning ? "Focusing..." : preset === 0 ? "Free Read" : `${preset}m Sprint`}
                  </span>
                </div>
              </div>

              {/* Timer Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  onClick={() => setIsRunning((r) => !r)}
                  className="dds-mini-navy-btn h-10 px-5"
                >
                  {isRunning ? (
                    <>
                      <Pause size={15} className="mr-1.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={15} className="mr-1.5" /> Start Reading
                    </>
                  )}
                </Button>

                {(elapsedMinutesInSession > 0 || (preset === 0 && stopwatchSeconds >= 20)) && (
                  <Button
                    type="button"
                    onClick={finishAndLogTimer}
                    className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
                  >
                    <Check size={14} className="mr-1" /> Finish & Log
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetTimer}
                  aria-label="Reset reading timer"
                  className="h-10 w-10 p-0 rounded-full border border-[#103A4E]/15 bg-white hover:bg-[#FAF5E8] text-[#103A4E]"
                >
                  <RotateCcw size={15} />
                </Button>
              </div>
            </div>

            {/* Built-in Ambient Soundscape Mixer */}
            <div className="dds-sanctuary-mixer">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#103A4E]">
                    Cozy Ambiance
                  </span>
                  {anySoundActive && (
                    <span className="dds-sound-eq" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {anySoundActive && (
                    <button
                      type="button"
                      onClick={muteAllSounds}
                      className="text-[0.68rem] font-extrabold text-[#F47A3C] hover:underline cursor-pointer"
                    >
                      Mute
                    </button>
                  )}
                  {anySoundActive ? (
                    <Volume2 size={14} className="text-[#103A4E]" />
                  ) : (
                    <VolumeX size={14} className="text-[#103A4E]/50" />
                  )}
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    aria-label="Ambient sound volume"
                    value={volume}
                    onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
                    className="w-20 accent-[#113145] cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {SOUND_CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const on = activeSounds[ch.key];
                  return (
                    <button
                      key={ch.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => void toggleSound(ch.key)}
                      className={`dds-sound-pad ${on ? "is-on" : ""}`}
                    >
                      <Icon size={16} />
                      <strong>{ch.label}</strong>
                      <span>{ch.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>

          {/* RIGHT PANEL: DAILY STREAK + PAGE & QUOTE JAR */}
          <article className="lg:col-span-6 dds-sanctuary-card flex flex-col justify-between">
            {/* Daily Goal & 7-Day Streak Banner */}
            <div className="dds-streak-box mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <span className="text-[0.66rem] font-extrabold uppercase tracking-wider text-[#103A4E]/70 block">
                    Today's Reading Habit
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <strong className="font-display text-2xl text-[#103A4E]">{todayMinutes}</strong>
                    <span className="text-xs font-extrabold text-[#103A4E]/75">
                      / {store.goalMinutes} min goal ({goalPct}%)
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE172] border border-[#103A4E]/15 text-[#103A4E] text-xs font-extrabold shadow-xs">
                  <Flame size={13} className="text-[#F47A3C]" />
                  <span>{streak}d streak</span>
                </div>
              </div>

              <div className="h-2.5 w-full rounded-full bg-white/80 border border-[#103A4E]/10 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F47A3C] to-[#f89b52] transition-all duration-300"
                  style={{ width: `${goalPct}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* 7-day rolling pills */}
                <div className="flex items-center gap-1.5" aria-label="Last 7 days activity">
                  {last7Days.map((day) => {
                    const mins = store.dailyMinutes[day.key] ?? 0;
                    const met = mins >= store.goalMinutes;
                    const active = mins > 0;
                    return (
                      <div
                        key={day.key}
                        title={`${day.key}: ${mins} min`}
                        className={`dds-day-dot ${met ? "is-goal" : active ? "is-partial" : ""} ${
                          day.isToday ? "is-today" : ""
                        }`}
                      >
                        <span>{day.shortLabel}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick offline book log + daily goal target */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      logMinutesToToday(15);
                      toast.success("+15 min logged to today's goal!");
                    }}
                    className="dds-quick-min-pill"
                  >
                    +15m
                  </button>
                  <select
                    aria-label="Daily reading goal"
                    value={store.goalMinutes}
                    onChange={(e) => {
                      const next = Number.parseInt(e.target.value, 10);
                      setStore((prev) => ({ ...prev, goalMinutes: next }));
                    }}
                    className="bg-white border border-[#103A4E]/15 rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold text-[#103A4E] cursor-pointer"
                  >
                    {GOAL_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        Goal: {g}m/day
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Capture Bookmark/Quote vs Quote Jar Toggle */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex p-1 rounded-full bg-[#FAF5E8] border border-[#103A4E]/12">
                <button
                  type="button"
                  onClick={() => setRightTab("capture")}
                  className={`dds-tab-btn ${rightTab === "capture" ? "is-active" : ""}`}
                >
                  Save Page & Quote
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab("jar")}
                  className={`dds-tab-btn ${rightTab === "jar" ? "is-active" : ""}`}
                >
                  Quote Jar ({store.quotes.length})
                </button>
              </div>
            </div>

            {rightTab === "capture" ? (
              <form onSubmit={handleSaveMoment} className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="block">
                      <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#103A4E]/75 block mb-1">
                        Current Page
                      </span>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 124"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        className="h-9 rounded-2xl bg-[#FAF5E8]/70 border-[#103A4E]/15 text-sm font-bold text-[#103A4E]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#103A4E]/75 block mb-1">
                        Total Pages
                      </span>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 340"
                        value={totalPagesInput}
                        onChange={(e) => setTotalPagesInput(e.target.value)}
                        className="h-9 rounded-2xl bg-[#FAF5E8]/70 border-[#103A4E]/15 text-sm font-bold text-[#103A4E]"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-[#103A4E]/75 block mb-1">
                      Favorite Line or Chapter Note
                    </span>
                    <textarea
                      rows={4}
                      value={quoteText}
                      onChange={(e) => setQuoteText(e.target.value)}
                      placeholder={
                        activeBook
                          ? `Capture a quote or thought from "${activeBook.title}"...`
                          : "Capture a favorite quote or reading reflection..."
                      }
                      className="w-full rounded-2xl border border-[#103A4E]/15 bg-[#FAF5E8]/70 px-3.5 py-2.5 text-sm font-semibold text-[#103A4E] placeholder:text-[#103A4E]/45 focus:outline-none focus:border-[#4DC4D8] focus:bg-white resize-none"
                    />
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[0.7rem] font-bold text-[#103A4E]/60">
                    Saved privately in your Nook
                  </span>
                  <Button type="submit" className="dds-mini-navy-btn h-10 px-5">
                    <Quote size={14} className="mr-1.5" /> Save to Nook
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col min-h-[250px] max-h-[305px]">
                {store.quotes.length > 0 ? (
                  <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                    {store.quotes.map((q) => (
                      <div key={q.id} className="dds-quote-note-card">
                        <p className="text-xs sm:text-sm font-bold text-[#103A4E] italic leading-relaxed">
                          “{q.text}”
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#103A4E]/10">
                          <div className="min-w-0">
                            <span className="text-[0.7rem] font-extrabold text-[#F47A3C] block truncate">
                              {q.bookTitle}
                            </span>
                            <span className="text-[0.65rem] font-bold text-[#103A4E]/60">
                              {q.bookAuthor}
                              {q.page ? ` · p. ${q.page}` : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => void handleCopyQuote(q)}
                              aria-label="Copy quote"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[#103A4E] hover:bg-[#DFF5F9] cursor-pointer"
                            >
                              {copiedId === q.id ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuote(q.id)}
                              aria-label="Delete quote"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[#103A4E]/70 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#FAF5E8]/80 rounded-2xl border border-dashed border-[#103A4E]/20 p-5">
                    <Quote size={26} className="text-[#F47A3C] mb-2" />
                    <strong className="font-display text-base text-[#103A4E]">
                      Your Quote Jar is ready
                    </strong>
                    <p className="text-xs font-semibold text-[#103A4E]/65 max-w-xs mt-1 mb-3">
                      Save favorite passages or chapter notes as you read to revisit anytime.
                    </p>
                    <Button
                      type="button"
                      onClick={() => setRightTab("capture")}
                      className="dds-mini-navy-btn h-8 px-4 text-xs"
                    >
                      Save Your First Line
                    </Button>
                  </div>
                )}
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
