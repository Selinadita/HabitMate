import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Flame,
  CalendarDays,
  Medal,
  Trophy,
  Sparkles,
  Plus,
  CheckCircle2,
  Target,
  TrendingUp,
  Menu,
  Bell,
  Sun,
  ArrowUpRight,
  CalendarCheck,
  Quote,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../lib/api";
import HabitModal from "./HabitModal";
import ProgressRing from "./ProgressRing";

const palette = {
  lavender: { bg: "#eee9ff", fg: "#8067d8", dot: "#c5b5ff" },
  pink: { bg: "#ffe9ee", fg: "#c36b83", dot: "#f3b2c4" },
  mint: { bg: "#e3f5ec", fg: "#398d69", dot: "#a8dfc3" },
  yellow: { bg: "#fff4d8", fg: "#ad8531", dot: "#f2d78d" },
  blue: { bg: "#e5f2ff", fg: "#4d87b7", dot: "#b7dafa" },
};
const quotes = [
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "A little progress each day adds up to big results.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "You are one habit away from a different life.",
  "Make today count. Your future self is cheering for you.",
];
const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(x.getDate()).padStart(2, "0")}`;
};
const pretty = (d) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
export default function Dashboard({ user, active, setActive, onMenu }) {
  const [habits, setHabits] = useState([]),
    [stats, setStats] = useState(null),
    [challenge, setChallenge] = useState(null),
    [logs, setLogs] = useState({}),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [deletingHabit, setDeletingHabit] = useState(null),
    [showDeleteModal, setShowDeleteModal] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [selectedDay, setSelectedDay] = useState(dateKey(new Date())),
    [dayDetail, setDayDetail] = useState(null),
    [saving, setSaving] = useState({});
  const today = dateKey(new Date());
  async function load() {
    setBusy(true);
    setError("");
    try {
      const [h, s, c] = await Promise.all([
        api.get("/habits"),
        api.get("/dashboard/stats"),
        api.get("/challenge"),
      ]);
      setHabits(h.data);
      setStats(s.data);
      setChallenge(c.data);
      const map = {};
      h.data.forEach((x) => {
        map[x.id] = {};
      });
      await Promise.all(
        h.data.map(async (h) => {
          const r = await api.get(`/habits/${h.id}/logs`);
          r.data.forEach((l) => {
            if (l.completed) map[h.id][l.log_date] = true;
          });
        }),
      );
      setLogs(map);
    } catch (e) {
      setError(e.response?.data?.detail || "Unable to load your dashboard.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function saveHabit(data) {
    try {
      if (editing) await api.put(`/habits/${editing.id}`, data);
      else await api.post("/habits", data);
      setModal(false);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || "Could not save habit");
    }
  }
  async function removeHabit(h) {
    try {
      await api.delete(`/habits/${h.id}`);
      await load();
    } catch (e) {
      alert("Could not delete habit");
    }
  }
  async function toggle(h, day) {
    if (
      day > today ||
      day < challenge?.start_date ||
      (day >= challenge?.start_date?.slice(0, 10) && false)
    )
      return;
    const key = `${h.id}-${day}`;
    setSaving((p) => ({ ...p, [key]: true }));
    const next = !logs[h.id]?.[day];
    setLogs((p) => ({ ...p, [h.id]: { ...p[h.id], [day]: next } }));
    try {
      await api.put(`/habits/${h.id}/logs`, { log_date: day, completed: next });
      const [s] = await Promise.all([api.get("/dashboard/stats")]);
      setStats(s.data);
    } catch (e) {
      setLogs((p) => ({ ...p, [h.id]: { ...p[h.id], [day]: !next } }));
      alert(e.response?.data?.detail || "Could not update this day");
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  }
  async function inspectDay(day) {
    setSelectedDay(day);
    try {
      const { data } = await api.get(`/dashboard/day/${day}`);
      setDayDetail(data);
    } catch {
      setDayDetail(null);
    }
  }
  const start = challenge?.start_date || today;
  const days = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const d = new Date(`${start}T12:00:00`);
        d.setDate(d.getDate() + i);
        return dateKey(d);
      }),
    [start],
  );
  const quote = quotes[Math.floor(Date.now() / 86400000) % quotes.length];
  const weekly = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = dateKey(d);
        const count = habits.filter((h) => logs[h.id]?.[key]).length;
        return {
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          done: count,
        };
      }),
    [habits, logs],
  );
  const todayDone = habits.filter((h) => logs[h.id]?.[today]).length;
  const todayPercent = habits.length
    ? Math.round((todayDone / habits.length) * 100)
    : 0;
  if (busy)
    return (
      <div className="min-h-screen grid place-items-center text-[#8067d8]">
        <LoaderCircle className="animate-spin" size={30} />
      </div>
    );
  return (
    <main className="max-w-[1500px] mx-auto px-5 sm:px-7 lg:px-9 py-7 lg:py-9">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-sm text-[#9693a2] mb-1">
              {" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <h1 className="text-[25px] sm:text-[30px] leading-tight font-extrabold tracking-tight">
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
              , {user.name.split(" ")[0]}{" "}
              <span className="text-[#e9bd69]">☀</span>
            </h1>
            <p className="text-sm text-[#9290a1] mt-1">
              A fresh day to make a little progress.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ffe9ee] text-[#bd748a] font-bold grid place-items-center">
            {user.name[0].toUpperCase()}
          </div>
        </div>
      </header>
      {error && (
        <div className="mb-5 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">
          {error}{" "}
          <button onClick={load} className="underline ml-2">
            Retry
          </button>
        </div>
      )}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          [
            "Active habits",
            stats?.active_habits || 0,
            "Your daily rituals",
            Target,
            "#eee9ff",
            "#8067d8",
          ],
          [
            "Completed today",
            `${todayDone}/${habits.length}`,
            "Keep the momentum",
            CheckCircle2,
            "#e3f5ec",
            "#398d69",
          ],
          [
            "Current streak",
            `${stats?.current_streak || 0} days`,
            "Consistency is key",
            Flame,
            "#ffe9ee",
            "#c36b83",
          ],
          [
            "Overall progress",
            `${stats?.overall_percent || 0}%`,
            "Your 30-day journey",
            TrendingUp,
            "#fff4d8",
            "#ad8531",
          ],
        ].map(([label, value, sub, Icon, bg, fg]) => (
          <div key={label} className="card p-4 sm:p-5">
            <div className="flex justify-between items-start">
              <div className="text-xs sm:text-sm text-[#898697] font-medium">
                {label}
              </div>
              <div
                className="w-9 h-9 rounded-xl grid place-items-center"
                style={{ background: bg, color: fg }}
              >
                <Icon size={18} />
              </div>
            </div>
            <div className="font-extrabold text-[23px] sm:text-[27px] tracking-tight mt-3">
              {value}
            </div>
            <div className="text-[11px] sm:text-xs text-[#aaa7b4] mt-1">
              {sub}
            </div>
          </div>
        ))}
      </section>
      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] gap-5 mb-5">
        <section className="card p-5 sm:p-6 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-extrabold text-lg">Your 30-day challenge</h2>
              <p className="text-xs text-[#9693a2] mt-1">
                Check off each small win as you go.
              </p>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setModal(true);
              }}
              className="bg-[#8067d8] hover:bg-[#7158c9] text-white rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2"
            >
              <Plus size={16} /> Add habit
            </button>
          </div>
          {habits.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#eee9ff] text-[#8067d8] grid place-items-center mb-3">
                <Sparkles size={24} />
              </div>
              <div className="font-bold">Your habit journey starts here</div>
              <p className="text-sm text-[#9693a2] mt-1 mb-4">
                Add your first habit to start tracking 30 days.
              </p>
              <button
                onClick={() => setModal(true)}
                className="text-sm text-[#8067d8] font-bold"
              >
                Create a habit +
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 text-[10px] text-[#9693a2]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#8067d8]" />{" "}
                Today{" "}
                <span className="ml-auto">
                  Scroll horizontally to see all 30 days →
                </span>
              </div>
              <div className="overflow-x-auto soft-scroll pb-2">
                <div className="min-w-[880px]">
                  <div
                    className="grid gap-1.5 mb-2"
                    style={{
                      gridTemplateColumns: "180px repeat(30,minmax(20px,1fr))",
                    }}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-[#aaa7b4] font-bold self-center">
                      Habit / day
                    </div>
                    {days.map((d, i) => (
                      <div
                        key={d}
                        className={`text-center text-[9px] font-bold ${
                          d === today ? "text-[#8067d8]" : ""
                        }`}
                        title={pretty(d)}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {habits.map((h) => (
                    <div
                      key={h.id}
                      className="grid gap-1.5 items-center py-2 border-t border-[#f5f3f6]"
                      style={{
                        gridTemplateColumns:
                          "180px repeat(30,minmax(20px,1fr))",
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div
                          className="w-8 h-8 shrink-0 rounded-xl grid place-items-center text-sm"
                          style={{
                            background:
                              palette[h.color]?.bg || palette.lavender.bg,
                          }}
                        >
                          {h.icon === "book"
                            ? "📖"
                            : h.icon === "activity"
                            ? "🏃"
                            : h.icon === "droplets"
                            ? "💧"
                            : h.icon === "sunrise"
                            ? "🌅"
                            : "✦"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {h.name}
                          </div>
                          <div className="text-[10px] text-[#aaa7b4]">
                            {h.category}
                          </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditing(h);
                              setModal(true);
                            }}
                            title="Edit habit"
                            className="p-1.5 rounded-lg text-[#aaa7b4] hover:bg-[#eee9ff] hover:text-[#8067d8]"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingHabit(h);
                              setShowDeleteModal(true);
                            }}
                            title="Delete habit"
                            className="p-1.5 rounded-lg text-[#EF4444] hover:bg-rose-50 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {days.map((d, i) => {
                        const checked = !!logs[h.id]?.[d],
                          locked = d > today || d < start || i >= 30;
                        const col = palette[h.color] || palette.lavender;
                        return (
                          <button
                            key={d}
                            disabled={locked || saving[`${h.id}-${d}`]}
                            title={`${pretty(d)}${
                              locked
                                ? " — unavailable"
                                : checked
                                ? " — completed"
                                : " — not completed"
                            }`}
                            onClick={() => toggle(h, d)}
                            className={`aspect-square min-w-[20px] rounded-[6px] border transition-all flex items-center justify-center ${
                              checked
                                ? "border-transparent text-white shadow-sm"
                                : "border-[#eeecf1] bg-[#faf9fb] hover:border-[#c9bde9]"
                            } ${locked ? "opacity-35 cursor-not-allowed" : ""}`}
                            style={
                              checked
                                ? { background: col.fg }
                                : d === today
                                ? { borderColor: "#8067d8" }
                                : {}
                            }
                          >
                            {checked ? "✓" : ""}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f3f1f4]">
                <div className="text-xs text-[#9693a2]">
                  {todayDone} of {habits.length} habits completed today
                </div>
                <div className="w-32 sm:w-44 h-2 bg-[#f0eef4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8067d8] rounded-full transition-all"
                    style={{ width: `${todayPercent}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </section>
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-1 gap-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold">Today's focus</h2>
                <p className="text-xs text-[#9693a2] mt-1">
                  One thing at a time.
                </p>
              </div>
              <ProgressRing value={todayPercent} size={66} />
            </div>
            <div className="mt-5 space-y-3">
              {habits.slice(0, 5).map((h) => {
                const col = palette[h.color] || palette.lavender;
                return (
                  <div key={h.id} className="flex items-center gap-3">
                    <button
                      onClick={() => toggle(h, today)}
                      className={`w-6 h-6 rounded-lg border grid place-items-center text-white shrink-0 ${
                        logs[h.id]?.[today]
                          ? "border-transparent"
                          : "border-[#dedbe5]"
                      }`}
                      style={logs[h.id]?.[today] ? { background: col.fg } : {}}
                    >
                      {logs[h.id]?.[today] ? "✓" : ""}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        logs[h.id]?.[today]
                          ? "line-through text-[#aaa7b4]"
                          : "font-semibold"
                      }`}
                    >
                      {h.name}
                    </span>
                    <span className="text-[10px] text-[#aaa7b4]">
                      {logs[h.id]?.[today] ? "Done" : "To do"}
                    </span>
                  </div>
                );
              })}
              {habits.length === 0 && (
                <p className="text-sm text-[#9693a2]">
                  Add a habit to see today's focus.
                </p>
              )}
            </div>
          </section>
          <section className="rounded-[22px] p-5 sm:p-6 bg-[#f0ecff] relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-white/80 text-[#8067d8] grid place-items-center mb-4">
              <Quote size={17} />
            </div>
            <div className="text-[10px] uppercase tracking-[.15em] font-extrabold text-[#907ed2] mb-2">
              A little reminder
            </div>
            <p className="font-bold leading-relaxed text-[#48415f]">
              “{quote}”
            </p>
            <div className="text-xs text-[#9488bf] mt-4">
              Your daily motivation
            </div>
            <div className="absolute -right-5 -bottom-8 w-28 h-28 rounded-full border-[18px] border-white/30" />
          </section>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-extrabold">Habit progress</h2>
              <p className="text-xs text-[#9693a2] mt-1">
                Your consistency, habit by habit.
              </p>
            </div>
            <span className="text-xs text-[#9693a2]">30-day target</span>
          </div>
          {habits.length ? (
            <div className="space-y-4">
              {habits.map((h) => {
                const s = stats?.habits?.find((x) => x.habit_id === h.id);
                const col = palette[h.color] || palette.lavender;
                return (
                  <div key={h.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold">{h.name}</div>
                      <div className="text-xs text-[#858397]">
                        {s?.completed || 0}/{h.target_days} days{" "}
                        <b className="text-[#39374a] ml-1">
                          {s?.percent || 0}%
                        </b>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#f2f0f4] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, s?.percent || 0)}%`,
                          background: col.fg,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#9693a2] py-8 text-center">
              Progress will appear when you add a habit.
            </p>
          )}
        </section>
        <section className="card p-5 sm:p-6 min-w-0">
          <div className="mb-4">
            <h2 className="font-extrabold">Weekly overview</h2>
            <p className="text-xs text-[#9693a2] mt-1">
              Completed habits in the last 7 days.
            </p>
          </div>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weekly}
                margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="doneFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9b86e8" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#9b86e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f0eef3" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#a09eaa" }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#a09eaa" }}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #f0eef3",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="done"
                  stroke="#927bdc"
                  strokeWidth={2.5}
                  fill="url(#doneFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="card p-5 sm:p-6 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="font-extrabold">Activity calendar</h2>
            <p className="text-xs text-[#9693a2] mt-1">
              A snapshot of your 30-day consistency.
            </p>
          </div>
          <div className="text-[10px] text-[#9693a2] flex items-center gap-2">
            Less <span className="w-3 h-3 rounded-[4px] bg-[#f0eef3]" />
            <span className="w-3 h-3 rounded-[4px] bg-[#e3dcfa]" />
            <span className="w-3 h-3 rounded-[4px] bg-[#b7a5ef]" />
            <span className="w-3 h-3 rounded-[4px] bg-[#8067d8]" /> More
          </div>
        </div>
        <div
          className="activity-grid grid gap-2"
          style={{ gridTemplateColumns: "repeat(10,minmax(0,1fr))" }}
        >
          {days.map((d, i) => {
            const count = habits.filter((h) => logs[h.id]?.[d]).length;
            const rate = habits.length ? count / habits.length : 0;
            return (
              <button
                key={d}
                onClick={() => inspectDay(d)}
                title={`${pretty(d)} · ${count}/${habits.length} completed`}
                className={`aspect-square rounded-lg transition hover:scale-110 ${
                  rate === 0
                    ? "bg-[#f0eef3]"
                    : rate < 0.5
                    ? "bg-[#e3dcfa]"
                    : rate < 1
                    ? "bg-[#b7a5ef]"
                    : "bg-[#8067d8]"
                } ${
                  selectedDay === d ? "ring-2 ring-offset-2 ring-[#8067d8]" : ""
                }`}
              />
            );
          })}
        </div>
        {dayDetail && (
          <div className="mt-5 p-4 rounded-2xl bg-[#faf9fb]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-sm">{pretty(dayDetail.date)}</div>
              <button
                onClick={() => setDayDetail(null)}
                className="text-xs text-[#8067d8]"
              >
                Close
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {dayDetail.habits.map((h) => (
                <div
                  key={h.habit_id}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className={`w-5 h-5 rounded-md grid place-items-center ${
                      h.completed
                        ? "bg-[#e3f5ec] text-[#398d69]"
                        : "bg-[#f0eef3] text-[#aaa7b4]"
                    }`}
                  >
                    {h.completed ? "✓" : "·"}
                  </span>
                  {h.name}
                  <span className="ml-auto text-[#aaa7b4]">
                    {h.completed ? "Done" : "Not yet"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-extrabold">Achievements</h2>
            <p className="text-xs text-[#9693a2] mt-1">
              Celebrate the milestones along the way.
            </p>
          </div>
          <span className="text-xs text-[#9693a2]">
            {stats?.achievements?.length || 0}/5 earned
          </span>
        </div>
       
<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
  {[
    {
      title: "First Step",
      desc: "Complete your first habit",
      code: "first_step",
      icon: Award,
    },
    {
      title: "3-Day Streak",
      desc: "Show up three days in a row",
      code: "streak_3",
      icon: Flame,
    },
    {
      title: "7-Day Streak",
      desc: "A full week of consistency",
      code: "streak_7",
      icon: CalendarDays,
    },
    {
      title: "14-Day Consistency",
      desc: "Two weeks of progress",
      code: "consistency_14",
      icon: Medal,
    },
    {
      title: "30-Day Champion",
      desc: "Complete the full challenge",
      code: "champion_30",
      icon: Trophy,
    },
  ].map(({ title, desc, code, icon: Icon }) => {
    const earned = stats?.achievements?.some(
      (a) => a.code === code
    );

    return (
      <div
        key={code}
        className={`rounded-2xl p-4 text-center border transition-all duration-300 ${
          earned
            ? "bg-[#fff5df] border-[#f2dfb8] hover:-translate-y-1"
            : "bg-[#faf9fb] border-[#eeedf1] opacity-55"
        }`}
      >
        <div
          className={`w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center ${
            earned
              ? "bg-[#fce8bd] text-[#b7832e]"
              : "bg-[#eeedf1] text-[#aaa7b2]"
          }`}
        >
          <Icon size={23} strokeWidth={1.8} />
        </div>

        <div className="text-xs font-extrabold text-[#292638]">
          {title}
        </div>

        <div className="text-[10px] text-[#9693a2] mt-1 leading-relaxed">
          {earned ? "Unlocked!" : desc}
        </div>
      </div>
    );
  })}
</div>

      </section>
      <footer className="text-center text-[11px] text-[#aaa7b4] py-8">
        Made for progress, not perfection · HabitMate
      </footer>
      {modal && (
        <HabitModal
          habit={editing}
          onClose={() => {
            setModal(false);
            setEditing(null);
          }}
          onSave={saveHabit}
        />
      )}

      {showDeleteModal && deletingHabit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
              <Trash2 size={22} className="text-rose-500" />
            </div>

            <h3 className="text-lg font-bold text-center text-[#292638]">
              Delete Habit?
            </h3>

            <p className="mt-2 text-sm text-center text-[#898696]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#514b64]">
                "{deletingHabit.name}"
              </span>
              ? All tracking history will also be deleted.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingHabit(null);
                }}
                className="flex-1 rounded-xl border border-[#e9e5f1] py-2.5 text-sm font-semibold text-[#777285] hover:bg-[#f8f7fb]"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await removeHabit(deletingHabit);
                  setShowDeleteModal(false);
                  setDeletingHabit(null);
                }}
                className="flex-1 rounded-xl border border-[#e9e5f1] bg-rose-500 py-2.5 text-sm font-semibold text-[#EF4444] hover:bg-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
