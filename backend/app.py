import os
import logging
import json
from flask import Flask
from flask_cors import CORS
from models.database import db
from routes.lesson_plans import lesson_plans_bp
from routes.ai_assist import ai_assist_bp
from routes.health import health_bp
from utils.logging_config import setup_logging

def create_app():
    app = Flask(__name__)

    setup_logging()

    DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///lesson_planner.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    app.register_blueprint(lesson_plans_bp, url_prefix="/api/lesson-plans")
    app.register_blueprint(ai_assist_bp, url_prefix="/api/ai")
    app.register_blueprint(health_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()
        logging.getLogger(__name__).info("Database initialized successfully.")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
