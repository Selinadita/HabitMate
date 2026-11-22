import { useEffect, useState } from "react";
import { X } from "lucide-react";
const colors = ["lavender", "pink", "mint", "yellow", "blue"];
export default function HabitModal({ habit, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Personal",
    icon: "sparkles",
    color: "lavender",
    start_date: new Date().toISOString().slice(0, 10),
    target_days: 30,
  });
  useEffect(() => {
    if (habit) setForm({ ...habit });
  }, [habit]);
  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  return (
    <div
      className="fixed inset-0 z-50 bg-[#242137]/30 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...form, target_days: Number(form.target_days) });
        }}
        className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-[480px] shadow-2xl"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-extrabold text-xl">
              {habit ? "Edit habit" : "Create a new habit"}
            </h2>
            <p className="text-sm text-[#9290a1] mt-1">
              Make it clear, simple, and achievable.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#aaa7b4]">
            <X />
          </button>
        </div>
        <div className="space-y-4">
          <label className="block text-xs font-bold text-[#666477]">
            Habit name
            <input
              name="name"
              required
              minLength="2"
              maxLength="100"
              value={form.name}
              onChange={change}
              placeholder="e.g. Read 10 pages"
              className="mt-1.5 w-full border border-[#eeecf1] bg-[#fbfafc] rounded-xl p-3 text-sm outline-none focus:border-[#a998e8]"
            />
          </label>
          <label className="block text-xs font-bold text-[#666477]">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={change}
              rows="2"
              placeholder="A little context for your future self…"
              className="mt-1.5 w-full border border-[#eeecf1] bg-[#fbfafc] rounded-xl p-3 text-sm outline-none resize-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-[#666477]">
              Category
              <select
                name="category"
                value={form.category}
                onChange={change}
                className="mt-1.5 w-full border border-[#eeecf1] rounded-xl p-3 bg-white text-sm"
              >
                <option>Personal</option>
                <option>Health</option>
                <option>Learning</option>
                <option>Wellness</option>
                <option>Productivity</option>
              </select>
            </label>
            <label className="text-xs font-bold text-[#666477]">
              Target days
              <select
                name="target_days"
                value={form.target_days}
                onChange={change}
                className="mt-1.5 w-full border border-[#eeecf1] rounded-xl p-3 bg-white text-sm"
              >
                {[7, 14, 21, 30].map((n) => (
                  <option key={n} value={n}>
                    {n} days
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs font-bold text-[#666477]">
            Start date
            <input
              name="start_date"
              type="date"
              required
              value={String(form.start_date).slice(0, 10)}
              onChange={change}
              className="mt-1.5 w-full border border-[#eeecf1] rounded-xl p-3 bg-white text-sm"
            />
          </label>
          <div>
            <div className="text-xs font-bold text-[#666477] mb-2">
              Color theme
            </div>
            <div className="flex gap-3">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-9 h-9 rounded-full border-2 ${
                    form.color === c
                      ? "border-[#55516a] scale-110"
                      : "border-transparent"
                  }`}
                  style={{
                    background: {
                      lavender: "#ded5ff",
                      pink: "#ffdce6",
                      mint: "#cdeedd",
                      yellow: "#ffe9ae",
                      blue: "#cfe8ff",
                    }[c],
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-7">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#eeecf1] text-sm font-bold text-[#777487]"
          >
            Cancel
          </button>
          <button className="flex-1 py-3 rounded-xl bg-[#8067d8] text-white text-sm font-bold">
            {habit ? "Save changes" : "Add habit"}
          </button>
        </div>
      </form>
    </div>
  );
}
