from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.entities import User, Habit, HabitLog, Challenge
from app.services.stats import build_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return build_stats(db, user.id)

@router.get("/day/{day}")
def day_detail(day: date, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Habit).filter(Habit.user_id == user.id, Habit.is_active == True).all()
    result = []
    for habit in rows:
        log = db.query(HabitLog).filter_by(habit_id=habit.id, log_date=day, completed=True).first()
        result.append({"habit_id": habit.id, "name": habit.name, "completed": bool(log), "color": habit.color})
    return {"date": day.isoformat(), "habits": result}
