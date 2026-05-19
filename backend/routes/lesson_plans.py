import logging
from flask import Blueprint, request, jsonify
from marshmallow import Schema, fields, validate, ValidationError
from models.database import db, LessonPlan
from datetime import datetime

logger = logging.getLogger(__name__)
lesson_plans_bp = Blueprint("lesson_plans", __name__)


class LessonPlanSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    objective = fields.Str(required=True, validate=validate.Length(min=1))
    summary = fields.Str(required=True, validate=validate.Length(min=1))
    scheduled_date = fields.Date(allow_none=True, load_default=None)
    discipline = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    contents = fields.Str(allow_none=True, load_default=None)
    support_resources = fields.Str(allow_none=True, load_default=None)
    tags = fields.List(fields.Str(), allow_none=True, load_default=[])


lesson_plan_schema = LessonPlanSchema()


@lesson_plans_bp.route("", methods=["GET"])
def list_lesson_plans():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    discipline = request.args.get("discipline", "").strip()
    tag = request.args.get("tag", "").strip()
    scheduled_date = request.args.get("scheduled_date", "").strip()
    search = request.args.get("search", "").strip()
    sort_by = request.args.get("sort_by", "created_at")
    sort_order = request.args.get("sort_order", "desc")

    query = LessonPlan.query

    if discipline:
        query = query.filter(LessonPlan.discipline.ilike(f"%{discipline}%"))
    if tag:
        query = query.filter(LessonPlan.tags.ilike(f"%{tag}%"))
    if scheduled_date:
        try:
            date_obj = datetime.strptime(scheduled_date, "%Y-%m-%d").date()
            query = query.filter(LessonPlan.scheduled_date == date_obj)
        except ValueError:
            pass
    if search:
        query = query.filter(LessonPlan.title.ilike(f"%{search}%"))

    sort_column = LessonPlan.title if sort_by == "title" else LessonPlan.created_at
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    per_page = min(per_page, 100)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    logger.info(f"Listed lesson plans: page={page}, total={paginated.total}, filters={{discipline={discipline!r}, tag={tag!r}, search={search!r}}}")

    return jsonify({
        "items": [lp.to_dict() for lp in paginated.items],
        "total": paginated.total,
        "page": page,
        "per_page": per_page,
        "pages": paginated.pages,
    })


@lesson_plans_bp.route("/<int:plan_id>", methods=["GET"])
def get_lesson_plan(plan_id):
    plan = LessonPlan.query.get_or_404(plan_id)
    return jsonify(plan.to_dict())


@lesson_plans_bp.route("", methods=["POST"])
def create_lesson_plan():
    try:
        data = lesson_plan_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    plan = LessonPlan(
        title=data["title"],
        objective=data["objective"],
        summary=data["summary"],
        scheduled_date=data.get("scheduled_date"),
        discipline=data["discipline"],
        contents=data.get("contents"),
        support_resources=data.get("support_resources"),
        tags=",".join(data.get("tags") or []),
    )
    db.session.add(plan)
    db.session.commit()
    logger.info(f"Created lesson plan: id={plan.id}, title={plan.title!r}, discipline={plan.discipline!r}")
    return jsonify(plan.to_dict()), 201


@lesson_plans_bp.route("/<int:plan_id>", methods=["PUT"])
def update_lesson_plan(plan_id):
    plan = LessonPlan.query.get_or_404(plan_id)
    try:
        data = lesson_plan_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    plan.title = data["title"]
    plan.objective = data["objective"]
    plan.summary = data["summary"]
    plan.scheduled_date = data.get("scheduled_date")
    plan.discipline = data["discipline"]
    plan.contents = data.get("contents")
    plan.support_resources = data.get("support_resources")
    plan.tags = ",".join(data.get("tags") or [])
    plan.updated_at = datetime.utcnow()

    db.session.commit()
    logger.info(f"Updated lesson plan: id={plan.id}, title={plan.title!r}")
    return jsonify(plan.to_dict())


@lesson_plans_bp.route("/<int:plan_id>", methods=["DELETE"])
def delete_lesson_plan(plan_id):
    plan = LessonPlan.query.get_or_404(plan_id)
    db.session.delete(plan)
    db.session.commit()
    logger.info(f"Deleted lesson plan: id={plan_id}")
    return jsonify({"message": "Lesson plan deleted successfully"}), 200
