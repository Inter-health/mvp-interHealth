// Tipos TypeScript alinhados com os contratos da API FastAPI

export interface User {
  id: string;
  name: string;
  crm: string;
  email: string;
  specialty: string | null;
  ehrProvider: string | null;
  terms_accepted: boolean;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: "bearer";
}

// Status possíveis de uma consulta (SCRUM-26 / SCRUM-27)
export type ConsultationStatus = "PENDING" | "PROCESSING" | "TRANSCRIBED" | "ERROR";

export interface Consultation {
  id: string;
  patient_name: string | null;
  status: ConsultationStatus;
  created_at: string; // ISO 8601
  error_reason: string | null;
  patient_consent_flag: boolean;
}

// Retorno de GET /consultations/{id}/status — inclui transcript quando TRANSCRIBED
export interface ConsultationDetail extends Consultation {
  transcript: string | null;
}

// Retorno de POST /consultations/upload (SCRUM-26)
export interface ConsultationUploadResponse {
  consultation_id: string;
  status: string;
  message: string;
}

export interface ApiError {
  detail: string | { violations: string[] };
}
