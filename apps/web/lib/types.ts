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
export interface ConsultationDetail {
  consultation_id: string;
  status: ConsultationStatus;
  patient_name: string | null;
  transcript: string | null;
  error_msg: string | null;
  created_at: string;
}

// Retorno de POST /consultations/upload (SCRUM-26)
export interface ConsultationUploadResponse {
  consultation_id: string;
  status: string;
  message: string;
}

// Retorno de GET /consultations (listagem sem transcript)
export interface ConsultationListItem {
  id: string;
  patient_name: string | null;
  patient_id: string | null;
  status: ConsultationStatus;
  created_at: string;
  error_msg: string | null;
}

export interface PatientListItem {
  id: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  detail: string | { violations: string[] };
}
