from datetime import date
from pydantic import BaseModel, Field

class HabitIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=1000)
    category: str = Field(default="Personal", max_length=40)
    icon: str = Field(default="sparkles", max_length=30)
    color: str = Field(default="lavender", max_length=20)
    start_date: date
    target_days: int = Field(default=30, ge=1, le=30)

class HabitOut(HabitIn):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class LogIn(BaseModel):
    log_date: date
    completed: bool

class LogOut(BaseModel):
    id: int
    habit_id: int
    log_date: date
    completed: bool
    class Config:
        from_attributes = True
