import os
from flask import Blueprint, jsonify
from models.database import db
from sqlalchemy import text

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    status = {"status": "ok", "services": {}}

    try:
        db.session.execute(text("SELECT 1"))
        status["services"]["database"] = "ok"
    except Exception as e:
        status["services"]["database"] = f"error: {str(e)}"
        status["status"] = "degraded"

    ai_key = os.environ.get("ANTHROPIC_API_KEY", "")
    status["services"]["ai"] = "configured" if ai_key else "not configured"

    http_status = 200 if status["status"] == "ok" else 503
    return jsonify(status), http_status
