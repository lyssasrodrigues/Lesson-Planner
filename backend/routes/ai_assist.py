import os
import time
import json
import logging
import requests
from flask import Blueprint, request, jsonify
from marshmallow import Schema, fields, validate, ValidationError

logger = logging.getLogger(__name__)
ai_assist_bp = Blueprint("ai_assist", __name__)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


class SmartAssistSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    discipline = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    summary = fields.Str(required=True, validate=validate.Length(min=1))


smart_assist_schema = SmartAssistSchema()

SYSTEM_PROMPT = """Você é um Assistente Pedagógico especializado em criar planos de aula ricos e completos.
Sua função é analisar o título, a disciplina e a ementa de uma aula e sugerir:
1. Conteúdos complementares relevantes e detalhados
2. Tópicos relacionados que enriquecem o aprendizado
3. Exatamente 3 tags que categorizam a aula

Responda APENAS com um objeto JSON válido, sem texto adicional, sem markdown, sem blocos de código.
O JSON deve ter exatamente esta estrutura:
{
  "contents": "string com os conteúdos complementares sugeridos, separados por ponto e vírgula",
  "support_resources": "string com recursos de apoio sugeridos (livros, artigos, ferramentas, sites)",
  "tags": ["tag1", "tag2", "tag3"]
}"""


@ai_assist_bp.route("/recommend", methods=["POST"])
def recommend():
    if not ANTHROPIC_API_KEY:
        logger.error("ANTHROPIC_API_KEY not configured")
        return jsonify({"error": "AI service not configured. Please set ANTHROPIC_API_KEY."}), 503

    try:
        data = smart_assist_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    title = data["title"]
    discipline = data["discipline"]
    summary = data["summary"]

    user_message = f"""Título da Aula: {title}
Disciplina: {discipline}
Ementa/Resumo: {summary}

Gere sugestões de conteúdos complementares, recursos de apoio e 3 tags para esta aula."""

    start_time = time.time()
    try:
        response = requests.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 1024,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_message}],
            },
            timeout=30,
        )
        latency = time.time() - start_time

        if response.status_code != 200:
            logger.error(f"AI API error: status={response.status_code}, body={response.text[:300]}")
            return jsonify({"error": "AI service returned an error. Please try again."}), 502

        result = response.json()
        token_usage = result.get("usage", {})
        total_tokens = token_usage.get("input_tokens", 0) + token_usage.get("output_tokens", 0)

        logger.info(
            f'[INFO] AI Request: Title="{title}", Discipline="{discipline}", '
            f"TokenUsage={total_tokens}, Latency={latency:.1f}s"
        )

        content_text = result["content"][0]["text"]
        content_text = content_text.strip()
        if content_text.startswith("```"):
            content_text = content_text.split("```")[1]
            if content_text.startswith("json"):
                content_text = content_text[4:]

        recommendations = json.loads(content_text.strip())

        if not isinstance(recommendations.get("tags"), list):
            recommendations["tags"] = []
        recommendations["tags"] = recommendations["tags"][:3]

        return jsonify(recommendations)

    except requests.Timeout:
        logger.error(f"AI API timeout after {time.time() - start_time:.1f}s for title={title!r}")
        return jsonify({"error": "AI service timed out. Please try again."}), 504
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        return jsonify({"error": "AI returned an unexpected format. Please try again."}), 502
    except Exception as e:
        logger.exception(f"Unexpected error in AI recommend: {e}")
        return jsonify({"error": "An unexpected error occurred. Please try again."}), 500
