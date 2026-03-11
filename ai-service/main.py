from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import openai
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CivicAI - AI Classification Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")


class ComplaintInput(BaseModel):
    text: str
    lang: Optional[str] = "en"
    phone: Optional[str] = ""


class ClassificationOutput(BaseModel):
    department: str
    severity: str
    summary_en: str
    eta_days: int
    state: Optional[str] = ""
    district: Optional[str] = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    language_detected: Optional[str] = "en"


CLASSIFY_PROMPT = """You are an expert municipal complaint classifier for Indian cities.

Given the complaint text (which may be in ANY Indian language — Hindi, Tamil, Marathi, Telugu, Bengali, Gujarati, Kannada, etc. or English), analyze it and return ONLY a valid JSON object with no extra text, no markdown, no code fences.

Rules:
- department: Choose EXACTLY one of: Roads, Sanitation, Water, Electricity, Other
  - Roads: potholes, damaged roads, traffic signals, streetlights
  - Sanitation: garbage, waste, drainage, sewage, cleanliness
  - Water: water supply, leakage, pipeline, drinking water
  - Electricity: power cuts, transformer issues, wiring
  - Other: parks, noise, illegal construction, etc.
- severity: Choose EXACTLY one of: Low, Medium, High, Critical
  - Critical: health hazard, accident risk, no water for days
  - High: major disruption, multiple days
  - Medium: inconvenience, few days
  - Low: minor issue, cosmetic
- summary_en: A single clear English sentence summarizing the complaint (max 20 words)
- eta_days: Integer — Critical=1, High=3, Medium=5, Low=7
- state: Indian state name if mentioned or inferable, else empty string
- district: District or area name if mentioned, else empty string
- lat: Latitude if location clearly identified (use approximate city center), else null
- lng: Longitude if location clearly identified, else null
- language_detected: Language the complaint was written in (e.g., "Hindi", "Tamil", "English")

Complaint text: {complaint_text}

Return ONLY the JSON object:"""


@app.get("/")
async def root():
    return {"status": "CivicAI AI Service running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/classify", response_model=ClassificationOutput)
async def classify_complaint(input: ComplaintInput):
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Complaint text is required")

    prompt = CLASSIFY_PROMPT.format(complaint_text=input.text)

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=400,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        raw = re.sub(r"```json|```", "", raw).strip()

        result = json.loads(raw)

        # Validate and sanitize
        valid_departments = ["Roads", "Sanitation", "Water", "Electricity", "Other"]
        valid_severities = ["Low", "Medium", "High", "Critical"]
        eta_map = {"Low": 7, "Medium": 5, "High": 3, "Critical": 1}

        dept = result.get("department", "Other")
        if dept not in valid_departments:
            dept = "Other"

        sev = result.get("severity", "Medium")
        if sev not in valid_severities:
            sev = "Medium"

        return ClassificationOutput(
            department=dept,
            severity=sev,
            summary_en=result.get("summary_en", input.text[:100]),
            eta_days=result.get("eta_days", eta_map.get(sev, 5)),
            state=result.get("state", ""),
            district=result.get("district", ""),
            lat=result.get("lat"),
            lng=result.get("lng"),
            language_detected=result.get("language_detected", "Unknown"),
        )

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e} | Raw: {raw}")
        # Fallback classification
        return ClassificationOutput(
            department="Other",
            severity="Medium",
            summary_en=input.text[:100],
            eta_days=5,
        )
    except Exception as e:
        print(f"Classification error: {e}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@app.post("/transcribe")
async def transcribe_audio_endpoint(url: str, account_sid: str, auth_token: str):
    """Transcribe audio from a URL (Twilio media)"""
    import httpx
    import tempfile

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, auth=(account_sid, auth_token))
            response.raise_for_status()

        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as f:
            f.write(response.content)
            temp_path = f.name

        with open(temp_path, "rb") as audio_file:
            transcript = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
            )

        os.unlink(temp_path)
        return {"text": transcript.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
