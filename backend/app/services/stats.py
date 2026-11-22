from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.entities import Habit, HabitLog, Achievement

MILESTONES = [
    ("first_step", "First Step", 1),
    ("streak_3", "3-Day Streak", 3),
    ("streak_7", "7-Day Streak", 7),
    ("consistency_14", "14-Day Consistency", 14),
    ("champion_30", "30-Day Champion", 30),
]

def calculate_streak(days):
    completed = set(days)
    streak = 0
    cursor = date.today()
    while cursor in completed:
        streak += 1
        cursor -= timedelta(days=1)
    if streak == 0 and date.today() - timedelta(days=1) in completed:
        cursor = date.today() - timedelta(days=1)
        while cursor in completed:
            streak += 1
            cursor -= timedelta(days=1)
    best = 0
    run = 0
    for day in sorted(completed):
        if 'prev' not in locals() or day != prev + timedelta(days=1):
            run = 1
        else:
            run += 1
        best = max(best, run)
        prev = day
    return streak, best

def build_stats(db: Session, user_id: int):
    habits = db.query(Habit).filter(Habit.user_id == user_id, Habit.is_active == True).all()
    today = date.today()
    challenge = db.query(__import__("app.models.entities", fromlist=["Challenge"]).Challenge).filter_by(user_id=user_id).first()
    start = challenge.start_date if challenge else today
    end = min(today, start + timedelta(days=29))
    logs = db.query(HabitLog).join(Habit).filter(Habit.user_id == user_id, HabitLog.completed == True, HabitLog.log_date >= start, HabitLog.log_date <= end).all()
    by_habit = {}
    by_day = {}
    for log in logs:
        by_habit.setdefault(log.habit_id, set()).add(log.log_date)
        by_day[log.log_date] = by_day.get(log.log_date, 0) + 1
    total_possible = len(habits) * max(0, (end - start).days + 1)
    completed_total = len(logs)
    habit_stats = []
    for habit in habits:
        days = by_habit.get(habit.id, set())
        streak, best = calculate_streak(days)
        habit_stats.append({
            "habit_id": habit.id, "name": habit.name, "completed": len(days),
            "target": habit.target_days, "percent": round(len(days) / habit.target_days * 100),
            "current_streak": streak, "best_streak": best,
        })
    day_rows = []
    for offset in range(30):
        day = start + timedelta(days=offset)
        count = by_day.get(day, 0)
        day_rows.append({"date": day.isoformat(), "completed": count, "total": len(habits),
                         "rate": round(count / len(habits) * 100) if habits else 0})
    today_count = by_day.get(today, 0)
    overall_streak, best_streak = calculate_streak({d for d, n in by_day.items() if n > 0})
    achievements = db.query(Achievement).filter_by(user_id=user_id).all()
    earned_codes = {a.code for a in achievements}
    earned = []
    for code, title, threshold in MILESTONES:
        if code == "first_step":
            qualifies = completed_total >= 1
        elif code in ("streak_3", "streak_7"):
            qualifies = best_streak >= threshold
        elif code == "consistency_14":
            qualifies = len([d for d, n in by_day.items() if n > 0]) >= threshold
        else:
            qualifies = len([d for d, n in by_day.items() if n == len(habits) and habits]) >= threshold
        if qualifies and code not in earned_codes:
            db.add(Achievement(user_id=user_id, code=code, title=title))
            earned.append(code)
    if earned:
        db.commit()
    return {
        "active_habits": len(habits), "completed_today": today_count,
        "today_total": len(habits), "overall_percent": round(completed_total / total_possible * 100) if total_possible else 0,
        "completed_total": completed_total, "current_streak": overall_streak,
        "best_streak": best_streak, "days_all_done": sum(1 for n in by_day.values() if n == len(habits) and habits),
        "habits": habit_stats, "days": day_rows,
        "achievements": [{"code": a.code, "title": a.title, "earned_at": a.earned_at.isoformat()} for a in db.query(Achievement).filter_by(user_id=user_id).all()],
        "challenge_start": start.isoformat(), "challenge_end": (start + timedelta(days=29)).isoformat()
    }
