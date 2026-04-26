"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import LiveDot from "@/components/ui/LiveDot";
import Pill from "@/components/ui/Pill";
import { apiFetch } from "@/lib/api";
import type { Patient, ConsultationListItem } from "@/lib/types";

const GENDER_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino", O: "Outro" };

const STATUS_MAP: Record<string, { label: string; tone: "green" | "slate" | "yellow" | "red" }> = {
  PENDING:     { label: "Aguardando",    tone: "slate" },
  PROCESSING:  { label: "Transcrevendo", tone: "yellow" },
  TRANSCRIBED: { label: "Pronta",         tone: "green" },
  ERROR:       { label: "Erro",           tone: "red" },
};

const AVATAR_COLORS = ["#2ECC71", "#26A69A", "#3498DB", "#9B59B6", "#E67E22"];

function avatarColor(name: string): string {
  const sum = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function calcAge(dob: string | null): string {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))} anos`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return `Hoje · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Icon>["name"]; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: "#F1F5F2",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={16} color="#6B7280" />
      </div>
      <div>
        <div style={{ font: "500 11px/1 var(--ih-font-body)", color: "#94A3B8", letterSpacing: ".3px", textTransform: "uppercase", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ font: "500 14px/1.3 var(--ih-font-body)", color: "#191C1D" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch(`/patients/${id}`).then((r) => (r.ok ? r.json() : null)),
      apiFetch(`/consultations?patient_id=${id}`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([p, c]) => {
      setPatient(p);
      setConsultations(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#94A3B8", font: "400 14px var(--ih-font-body)" }}>
        Carregando paciente…
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p style={{ color: "#6B7280" }}>Paciente não encontrado.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()} style={{ marginTop: 12 }}>
          ← Voltar
        </Button>
      </div>
    );
  }

  const dobFormatted = patient.date_of_birth
    ? new Date(patient.date_of_birth + "T12:00:00").toLocaleDateString("pt-BR") + " · " + calcAge(patient.date_of_birth)
    : null;

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, maxWidth: 860, margin: "0 auto" }}>

      {/* Header nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/pacientes")}>
          ← Pacientes
        </Button>
      </div>

      {/* Patient info card */}
      <Card>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Avatar initials={initials(patient.name)} size={72} color={avatarColor(patient.name)} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <h2 style={{ font: "700 22px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>
                {patient.name}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/pacientes/${id}/editar`)}
              >
                <Icon name="settings" size={14} color="#6B7280" />
                Editar
              </Button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
              {dobFormatted && (
                <InfoRow icon="calendar" label="Nascimento" value={dobFormatted} />
              )}
              {patient.gender && (
                <InfoRow icon="users" label="Sexo" value={GENDER_LABEL[patient.gender] ?? patient.gender} />
              )}
              {patient.phone && (
                <InfoRow icon="phone" label="Telefone" value={patient.phone} />
              )}
              {patient.email && (
                <InfoRow icon="bell" label="E-mail" value={patient.email} />
              )}
            </div>

            {patient.notes && (
              <div style={{
                marginTop: 16, padding: "12px 16px", borderRadius: 10,
                background: "#F8FAFB", border: "1px solid #EAEDED",
              }}>
                <div style={{ font: "600 11px/1 var(--ih-font-body)", color: "#94A3B8", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 6 }}>
                  Observações
                </div>
                <p style={{ font: "400 13px/1.6 var(--ih-font-body)", color: "#3D4A3E", margin: 0 }}>
                  {patient.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Consultations */}
      <Card padding={0}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid #EAEDED",
        }}>
          <div>
            <h3 style={{ font: "700 17px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>
              Histórico de consultas
            </h3>
            <p style={{ font: "400 12px/1.4 var(--ih-font-body)", color: "#6B7280", margin: "3px 0 0" }}>
              {consultations.length} consulta{consultations.length !== 1 ? "s" : ""} registrada{consultations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/dashboard/nova-consulta")}
          >
            <Icon name="mic" size={14} color="#fff" />
            Nova consulta
          </Button>
        </div>

        {consultations.length === 0 && (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Icon name="mic" size={32} color="#CBD5E1" />
            <p style={{ font: "500 14px/1.5 var(--ih-font-body)", color: "#94A3B8", marginTop: 10, marginBottom: 0 }}>
              Nenhuma consulta vinculada a este paciente.
            </p>
          </div>
        )}

        {consultations.map((c, i) => {
          const st = STATUS_MAP[c.status] ?? { label: c.status, tone: "slate" as const };
          const isClickable = c.status === "TRANSCRIBED";
          return (
            <div
              key={c.id}
              onClick={() => isClickable && router.push(`/dashboard/consulta/${c.id}`)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: 20,
                padding: "16px 24px",
                borderBottom: i === consultations.length - 1 ? "none" : "1px solid #F1F5F2",
                cursor: isClickable ? "pointer" : "default",
              }}
            >
              <div>
                <div style={{ font: "600 14px/1.2 var(--ih-font-body)", color: "#191C1D", marginBottom: 3 }}>
                  Consulta gravada
                </div>
                <div style={{ font: "400 12px/1.2 var(--ih-font-body)", color: "#6B7280" }}>
                  {fmtDate(c.created_at)}
                </div>
              </div>
              <Pill tone={st.tone}>
                {(c.status === "PENDING" || c.status === "PROCESSING") && <LiveDot />}
                {st.label}
              </Pill>
              {isClickable && <Icon name="chevronRight" size={18} color="#94A3B8" />}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
