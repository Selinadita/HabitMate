from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.entities import User, Habit, HabitLog, Challenge
from app.schemas.habit import HabitIn, HabitOut, LogIn, LogOut

router = APIRouter(tags=["Habits"])

@router.get("/habits", response_model=list[HabitOut])
def list_habits(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Habit).filter(Habit.user_id == user.id).order_by(Habit.created_at.desc()).all()

@router.post("/habits", response_model=HabitOut, status_code=201)
def create_habit(payload: HabitIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    habit = Habit(user_id=user.id, **payload.model_dump())
    db.add(habit); db.commit(); db.refresh(habit)
    return habit

@router.put("/habits/{habit_id}", response_model=HabitOut)
def update_habit(habit_id: int, payload: HabitIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter_by(id=habit_id, user_id=user.id).first()
    if not habit: raise HTTPException(status_code=404, detail="Habit not found")
    for key, value in payload.model_dump().items(): setattr(habit, key, value)
    db.commit(); db.refresh(habit)
    return habit

@router.delete("/habits/{habit_id}", status_code=204)
def delete_habit(habit_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter_by(id=habit_id, user_id=user.id).first()
    if not habit: raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit); db.commit()

@router.get("/habits/{habit_id}/logs", response_model=list[LogOut])
def habit_logs(habit_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter_by(id=habit_id, user_id=user.id).first()
    if not habit: raise HTTPException(status_code=404, detail="Habit not found")
    return db.query(HabitLog).filter_by(habit_id=habit_id).order_by(HabitLog.log_date).all()

@router.put("/habits/{habit_id}/logs", response_model=LogOut)
def set_log(habit_id: int, payload: LogIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    habit = db.query(Habit).filter_by(id=habit_id, user_id=user.id).first()
    if not habit: raise HTTPException(status_code=404, detail="Habit not found")
    challenge = db.query(Challenge).filter_by(user_id=user.id).first()
    today = date.today()
    if not challenge or payload.log_date < challenge.start_date or payload.log_date > today or payload.log_date >= challenge.start_date + timedelta(days=30):
        raise HTTPException(status_code=400, detail="You can only update dates within your active 30-day challenge and not in the future")
    log = db.query(HabitLog).filter_by(habit_id=habit_id, log_date=payload.log_date).first()
    if payload.completed:
        if not log:
            log = HabitLog(habit_id=habit_id, log_date=payload.log_date, completed=True)
            db.add(log)
        else: log.completed = True
    elif log:
        db.delete(log)
        db.commit()
        return {"id": 0, "habit_id": habit_id, "log_date": payload.log_date, "completed": False}
    db.commit(); db.refresh(log)
    return log

@router.get("/challenge")
def challenge_info(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    challenge = db.query(Challenge).filter_by(user_id=user.id).first()
    if not challenge: raise HTTPException(status_code=404, detail="Challenge not found")
    return {"start_date": challenge.start_date.isoformat(), "duration_days": challenge.duration_days,
            "end_date": (challenge.start_date + timedelta(days=challenge.duration_days-1)).isoformat(),
            "is_active": challenge.is_active}
