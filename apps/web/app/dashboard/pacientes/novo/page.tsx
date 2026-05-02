"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/api";

interface FormData {
  name: string;
  cpf: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY: FormData = {
  name: "", cpf: "", date_of_birth: "",
  gender: "", phone: "", email: "", notes: "",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ font: "600 13px/1 var(--ih-font-body)", color: "#3D4A3E" }}>
        {label}
        {required
          ? <span style={{ color: "#E74C3C", marginLeft: 3 }}>*</span>
          : <span style={{ color: "#94A3B8", fontWeight: 400, marginLeft: 4 }}>(opcional)</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, border: "1px solid #D1D5DB",
  font: "400 14px/1.5 var(--ih-font-body)", color: "#191C1D",
  outline: "none", width: "100%", boxSizing: "border-box",
};

const today = new Date().toISOString().split("T")[0];

function maskCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export default function NovoPackientePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    if (form.date_of_birth && form.date_of_birth > today) {
      setError("Data de nascimento não pode ser no futuro.");
      return;
    }
    setLoading(true);
    setError(null);

    const payload: Record<string, string> = { name: form.name.trim() };
    if (form.cpf.trim())          payload.cpf           = form.cpf.trim();
    if (form.date_of_birth)       payload.date_of_birth = form.date_of_birth;
    if (form.gender)              payload.gender        = form.gender;
    if (form.phone.trim())        payload.phone         = form.phone.trim();
    if (form.email.trim())        payload.email         = form.email.trim();
    if (form.notes.trim())        payload.notes         = form.notes.trim();

    try {
      const res = await apiFetch("/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.detail === "string" ? err.detail : "Erro ao cadastrar paciente.");
      }
      const patient = await res.json();
      router.push(`/dashboard/pacientes/${patient.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Voltar
        </Button>
        <h1 style={{ font: "700 22px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>
          Novo paciente
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Nome */}
            <Field label="Nome completo" required>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Ex: Maria Silva"
                autoFocus
                style={inputStyle}
              />
            </Field>

            {/* CPF + Data de nascimento */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="CPF">
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  style={inputStyle}
                />
              </Field>
              <Field label="Data de nascimento">
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={set("date_of_birth")}
                  max={today}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Sexo + Telefone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Sexo biológico">
                <select value={form.gender} onChange={set("gender")} style={inputStyle}>
                  <option value="">Não informado</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                </select>
              </Field>
              <Field label="Telefone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
                  placeholder="(11) 99999-0000"
                  inputMode="numeric"
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* E-mail */}
            <Field label="E-mail">
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="paciente@email.com"
                style={inputStyle}
              />
            </Field>

            {/* Observações */}
            <Field label="Observações clínicas">
              <textarea
                value={form.notes}
                onChange={set("notes")}
                placeholder="Alergias, condições crônicas, medicamentos em uso…"
                rows={4}
                style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
              />
            </Field>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "#FEF2F2", border: "1px solid #FECACA",
                font: "400 13px/1.5 var(--ih-font-body)", color: "#E74C3C",
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 4 }}>
              <Button variant="ghost" size="md" onClick={() => router.back()} type="button">
                Cancelar
              </Button>
              <Button variant="primary" size="md" type="submit" disabled={loading}>
                {loading ? (
                  "Salvando…"
                ) : (
                  <>
                    <Icon name="check" size={14} color="#fff" />
                    Cadastrar paciente
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
