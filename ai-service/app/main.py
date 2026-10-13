import json
import math
import os
import re
from typing import Any, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

app = FastAPI(title="Smart Coupon AI Service")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001").removeprefix("models/")


def _genai_client():
    try:
        from google import genai
    except ImportError:
        return None
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception:
        return None


def _generate_with_retry(client: Any, model: str, contents: Any) -> Any:
    try:
        from tenacity import (
            retry,
            stop_after_attempt,
            wait_exponential,
            retry_if_exception_type,
        )
        from google.genai.errors import ServerError

        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=2, min=2, max=10),
            retry=retry_if_exception_type(ServerError),
            reraise=True,
        )
        def _call() -> Any:
            return client.models.generate_content(model=model, contents=contents)

        return _call()
    except ImportError:
        return client.models.generate_content(model=model, contents=contents)


def _is_gemini_configured() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


def _response_text(resp: Any) -> str:
    try:
        candidates = getattr(resp, "candidates", None) or []
        if candidates:
            parts = getattr(getattr(candidates[0], "content", None), "parts", None) or []
            texts = [getattr(p, "text", "") or "" for p in parts]
            if any(texts):
                return "".join(texts).strip()
        return (getattr(resp, "text", "") or "").strip()
    except Exception:
        return ""


class SearchCoupon(BaseModel):
    id: str = Field(alias="_id", default="")
    title: str = ""
    code: str = ""
    store: str = ""
    category: str = ""
    description: str = ""
    discountType: str = ""

    model_config = {"populate_by_name": True}


class SearchRequest(BaseModel):
    query: str
    coupons: List[SearchCoupon] = []
    limit: int = 10


class EmbedRequest(BaseModel):
    texts: List[str]


class ExtractRequest(BaseModel):
    image: str  # base64-encoded image bytes
    mimeType: str = "image/png"


class AnswerRequest(BaseModel):
    question: str
    coupons: List[SearchCoupon] = []
    limit: int = 10


MAX_IMAGE_BYTES = 5 * 1024 * 1024

DRAFT_FIELDS = (
    "title",
    "code",
    "description",
    "category",
    "store",
    "discountType",
    "discountValue",
    "minimumPurchase",
    "maximumDiscount",
    "validFrom",
    "expiryDate",
    "usageLimit",
    "termsAndConditions",
)


def _keyword_search(query: str, coupons: List[dict], limit: int) -> List[dict]:
    tokens = [t for t in re.findall(r"\w+", query.lower()) if t]
    if not tokens:
        return coupons[:limit]
    scored: list[tuple[int, dict]] = []
    for c in coupons:
        hay = " ".join(
            str(c.get(k, "") or "")
            for k in ("title", "code", "store", "category", "description", "discountType")
        ).lower()
        score = sum(1 for t in tokens if t in hay)
        if score > 0:
            scored.append((score, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:limit]]


def _coupon_text(c: dict) -> str:
    return " ".join(
        str(c.get(k, "") or "")
        for k in ("title", "code", "store", "category", "description", "discountType")
    )


def _cosine(a: List[float], b: List[float]) -> float:
    denom = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(x * x for x in b))
    if not denom:
        return 0.0
    return sum(x * y for x, y in zip(a, b)) / denom


def _gemini_embed(texts: List[str]) -> Optional[List[List[float]]]:
    client = _genai_client()
    if client is None:
        return None
    try:
        vectors: List[List[float]] = []
        for text in texts[:50]:
            res = client.models.embed_content(model=GEMINI_EMBEDDING_MODEL, contents=text)
            vectors.append(list(res.embeddings[0].values))
        return vectors
    except Exception:
        return None


def _semantic_rank(query: str, coupons: List[dict], limit: int) -> Optional[List[dict]]:
    vectors = _gemini_embed([query] + [_coupon_text(c) for c in coupons])
    if not vectors or len(vectors) != len(coupons) + 1:
        return None
    scored = sorted(
        ((_cosine(vectors[0], v), c) for v, c in zip(vectors[1:], coupons)),
        key=lambda x: x[0],
        reverse=True,
    )
    return [c for _, c in scored[:limit]]


def _gemini_rank(query: str, coupons: List[dict], limit: int) -> Optional[List[dict]]:
    client = _genai_client()
    if client is None:
        return None
    try:
        slim = [
            {
                "id": c.get("_id", c.get("id", "")),
                "title": c.get("title", ""),
                "store": c.get("store", ""),
                "category": c.get("category", ""),
                "description": (c.get("description", "") or "")[:200],
            }
            for c in coupons[:50]
        ]
        model = GEMINI_MODEL
        prompt = (
            "You rank coupons for a natural-language query.\n"
            f"Query: {query}\n"
            f"Coupons (JSON): {json.dumps(slim)}\n"
            "Return ONLY a JSON array of coupon ids ordered most-relevant first, "
            f"max {limit} ids. Example: [\"id1\", \"id2\"]."
        )
        resp = _generate_with_retry(client, model, prompt)
        text = _response_text(resp)
        start, end = text.find("["), text.rfind("]")
        if start == -1 or end == -1:
            return None
        ids = json.loads(text[start : end + 1])
        by_id = {c.get("_id", c.get("id", "")): c for c in coupons}
        ranked = [by_id[i] for i in ids if i in by_id]
        return ranked[:limit] if ranked else None
    except Exception:
        return None


@app.get("/")
def root():
    return {
        "status": "AI Service is running",
        "provider": "gemini",
        "model": GEMINI_MODEL,
        "embedding_model": GEMINI_EMBEDDING_MODEL,
        "configured": _is_gemini_configured(),
    }


@app.get("/health")
def health():
    return {"status": "healthy", "gemini_configured": _is_gemini_configured()}


@app.post("/search")
def search(req: SearchRequest):
    if not req.query or not req.query.strip():
        return {"success": False, "message": "Query is required"}
    coupons = [c.model_dump(by_alias=True) for c in req.coupons]
    limit = max(1, min(req.limit or 10, 50))
    ranked: Optional[List[Any]] = None
    method = "keyword"
    if _is_gemini_configured():
        ranked = _gemini_rank(req.query, coupons, limit)
        if ranked is not None:
            method = "gemini"
    if ranked is None:
        ranked = _keyword_search(req.query, coupons, limit)
    return {"success": True, "data": {"coupons": ranked, "method": method}}


def _sanitize_draft(parsed: Any) -> dict:
    draft: dict = {}
    if not isinstance(parsed, dict):
        return draft
    for key in DRAFT_FIELDS:
        value = parsed.get(key)
        if value is None or value == "":
            continue
        draft[key] = value
    if draft.get("discountType") not in ("percentage", "fixed", "free_shipping", "other"):
        draft["discountType"] = "other"
    try:
        if "discountValue" in draft:
            draft["discountValue"] = float(draft["discountValue"])
    except (TypeError, ValueError):
        draft.pop("discountValue", None)
    return draft


@app.post("/embed")
def embed(req: EmbedRequest):
    if not req.texts:
        return {"success": False, "message": "texts is required"}
    vectors = _gemini_embed(req.texts)
    if vectors is None:
        return {"success": False, "message": "Gemini embeddings unavailable (missing key or library)"}
    return {"success": True, "data": {"embeddings": vectors, "model": GEMINI_EMBEDDING_MODEL}}


@app.post("/semantic-search")
def semantic_search(req: SearchRequest):
    if not req.query or not req.query.strip():
        return {"success": False, "message": "Query is required"}
    coupons = [c.model_dump(by_alias=True) for c in req.coupons]
    limit = max(1, min(req.limit or 10, 50))
    ranked = _semantic_rank(req.query, coupons, limit) if _is_gemini_configured() else None
    method = "gemini-embeddings"
    if ranked is None:
        ranked = _keyword_search(req.query, coupons, limit)
        method = "keyword"
    return {"success": True, "data": {"coupons": ranked, "method": method}}


@app.post("/extract")
def extract(req: ExtractRequest):
    import base64

    if not req.image:
        return {"success": False, "message": "image is required"}
    if not req.mimeType.startswith("image/"):
        return {"success": False, "message": "mimeType must be an image type"}
    try:
        raw = base64.b64decode(req.image, validate=True)
    except Exception:
        return {"success": False, "message": "image is not valid base64"}
    if len(raw) > MAX_IMAGE_BYTES:
        return {"success": False, "message": "image exceeds 5MB limit"}
    client = _genai_client()
    if client is None:
        return {"success": False, "message": "Gemini extraction unavailable (missing key or library)"}
    try:
        from google.genai import types

        part = types.Part.from_bytes(data=raw, mime_type=req.mimeType)
        prompt = (
            "Extract coupon details from this image. Return ONLY a JSON object "
            "with any of these keys: title, code, description, category, store, "
            "discountType (one of percentage, fixed, free_shipping, other), "
            "discountValue (number), minimumPurchase (number), maximumDiscount "
            "(number), validFrom (YYYY-MM-DD), expiryDate (YYYY-MM-DD), "
            "usageLimit (number), termsAndConditions. Omit keys you cannot find."
        )
        resp = _generate_with_retry(client, GEMINI_MODEL, [prompt, part])
        text = _response_text(resp)
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1:
            return {"success": False, "message": "could not parse coupon from image"}
        draft = _sanitize_draft(json.loads(text[start : end + 1]))
        return {"success": True, "data": {"coupon": draft, "model": GEMINI_MODEL}}
    except Exception:
        return {"success": False, "message": "extraction failed"}


@app.post("/answer")
def answer(req: AnswerRequest):
    if not req.question or not req.question.strip():
        return {"success": False, "message": "question is required"}
    coupons = [c.model_dump(by_alias=True) for c in req.coupons]
    limit = max(1, min(req.limit or 10, 50))
    if not coupons:
        return {
            "success": True,
            "data": {
                "answer": "You have no saved coupons yet, so I can't find any matches.",
                "coupons": [],
                "model": GEMINI_MODEL,
            },
        }
    client = _genai_client()
    if client is None:
        return {"success": False, "message": "Gemini answering unavailable (missing key or library)"}
    try:
        by_id = {c.get("_id", c.get("id", "")): c for c in coupons}
        slim = [
            {
                "id": c.get("_id", c.get("id", "")),
                "title": c.get("title", ""),
                "code": c.get("code", ""),
                "store": c.get("store", ""),
                "category": c.get("category", ""),
                "description": (c.get("description", "") or "")[:200],
                "discountType": c.get("discountType", ""),
                "discountValue": c.get("discountValue", ""),
                "expiryDate": c.get("expiryDate", ""),
            }
            for c in coupons[:30]
        ]
        prompt = (
            "Answer the user's question using ONLY the coupons below. "
            "If none apply, say so plainly. Reply with ONLY a JSON object "
            '{"answer": "...", "ids": ["supporting coupon ids"]}.\n'
            f"Question: {req.question}\n"
            f"Coupons (JSON): {json.dumps(slim)}"
        )
        resp = _generate_with_retry(client, GEMINI_MODEL, prompt)
        text = _response_text(resp)
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1:
            return {"success": False, "message": "could not parse answer"}
        parsed = json.loads(text[start : end + 1])
        ids = [i for i in (parsed.get("ids") or []) if i in by_id][:limit]
        return {
            "success": True,
            "data": {
                "answer": str(parsed.get("answer", "")),
                "coupons": [by_id[i] for i in ids],
                "model": GEMINI_MODEL,
            },
        }
    except Exception:
        return {"success": False, "message": "answering failed"}
