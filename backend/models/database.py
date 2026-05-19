from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class LessonPlan(db.Model):
    __tablename__ = "lesson_plans"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    objective = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text, nullable=False)
    scheduled_date = db.Column(db.Date, nullable=True)
    discipline = db.Column(db.String(100), nullable=False)
    contents = db.Column(db.Text, nullable=True)
    support_resources = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "objective": self.objective,
            "summary": self.summary,
            "scheduled_date": self.scheduled_date.isoformat() if self.scheduled_date else None,
            "discipline": self.discipline,
            "contents": self.contents,
            "support_resources": self.support_resources,
            "tags": self.tags.split(",") if self.tags else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
