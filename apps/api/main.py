import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="InterHealth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)


class ConsultationCreate(BaseModel):
    patient_name: str
    patient_consent: bool


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/consultations", status_code=201)
def create_consultation(body: ConsultationCreate):
    result = supabase.table("consultations").insert({
        "patient_name": body.patient_name,
        "patient_consent": body.patient_consent,
        "status": "RECORDING",
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create consultation")

    return {"id": result.data[0]["id"]}