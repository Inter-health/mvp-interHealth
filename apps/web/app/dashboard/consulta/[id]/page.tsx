"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SpeakerBubble from "@/components/ui/SpeakerBubble";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/ui/Pill";
import LiveDot from "@/components/ui/LiveDot";
import ClinicalDisclaimer from "@/components/consulta/ClinicalDisclaimer";
import SOAPViewer from "@/components/consulta/SOAPViewer";
import ExamSuggestionCard from "@/components/consulta/ExamSuggestionCard";
import { apiFetch } from "@/lib/api";
import type {
  ConsultationDetail,
  ExamCategory,
  ExamPriority,
  ExamStatus,
  ExamSuggestion,
  SOAPContent,
  SOAPResponse,
} from "@/lib/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_MAP: Record<string, { label: string; tone: "green" | "slate" | "greenSoft" | "red" | "yellow" }> = {
  PENDING:     { label: "Aguardando",    tone: "slate" },
  PROCESSING:  { label: "Transcrevendo", tone: "yellow" },
  TRANSCRIBED: { label: "Pronta",         tone: "green" },
  ERROR:       { label: "Erro",           tone: "red" },
};

const GREEN = "#2ECC71";

const EMPTY_MANUAL = {
  exam_name: "",
  category: "laboratorial" as ExamCategory,
  priority: "media" as ExamPriority,
  justification: "",
};

export default function ConsultaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SOAP
  const [soapData, setSoapData] = useState<SOAPResponse | null>(null);
  const [soapGenLoading, setSoapGenLoading] = useState(false);
  const [soapActionLoading, setSoapActionLoading] = useState(false);
  const [soapError, setSoapError] = useState<string | null>(null);

  // Exames
  const [exams, setExams] = useState<ExamSuggestion[]>([]);
  const [examGenLoading, setExamGenLoading] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);
  const [examSaving, setExamSaving] = useState<Set<string>>(new Set());
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [manualLoading, setManualLoading] = useState(false);

  const extrasLoadedRef = useRef(false);

  async function fetchStatus() {
    try {
      const res = await apiFetch(`/consultations/${id}/status`);
      if (!res.ok) return;
      const d: ConsultationDetail = await res.json();
      setData(d);
      setLoading(false);
      if (d.status === "TRANSCRIBED" || d.status === "ERROR") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [id]);

  // Carrega SOAP + sugestões uma vez quando a transcrição estiver pronta.
  useEffect(() => {
    if (data?.status !== "TRANSCRIBED" || extrasLoadedRef.current) return;
    extrasLoadedRef.current = true;

    (async () => {
      try {
        const res = await apiFetch(`/consultations/${id}/soap`);
        if (res.ok) setSoapData(await res.json()); // 404 = SOAP ainda não gerado (normal)
      } catch { /* degradação graciosa */ }
      try {
        const res = await apiFetch(`/consultations/${id}/exam-suggestions`);
        if (res.ok) setExams(await res.json());
      } catch { /* degradação graciosa */ }
    })();
  }, [data?.status, id]);

  // ── Ações SOAP ───────────────────────────────────────────────
  async function handleGenerateSOAP() {
    setSoapError(null);
    setSoapGenLoading(true);
    try {
      const res = await apiFetch(`/consultations/${id}/soap/generate`, { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(typeof e.detail === "string" ? e.detail : "Falha ao gerar prontuário.");
      }
      setSoapData(await res.json());
    } catch (err) {
      setSoapError(err instanceof Error ? err.message : "Não foi possível gerar agora. Tente novamente.");
    } finally {
      setSoapGenLoading(false);
    }
  }

  async function handleConfirmSOAP(edits: Partial<SOAPContent>) {
    setSoapError(null);
    setSoapActionLoading(true);
    try {
      const res = await apiFetch(`/consultations/${id}/soap/confirm`, {
        method: "POST",
        body: JSON.stringify({ action: "confirm", ...edits }),
      });
      if (!res.ok) throw new Error();
      setSoapData(await res.json());
    } catch {
      setSoapError("Não foi possível confirmar o prontuário. Tente novamente.");
    } finally {
      setSoapActionLoading(false);
    }
  }

  async function handleRejectSOAP() {
    setSoapError(null);
    setSoapActionLoading(true);
    try {
      const res = await apiFetch(`/consultations/${id}/soap/confirm`, {
        method: "POST",
        body: JSON.stringify({ action: "reject" }),
      });
      if (!res.ok) throw new Error();
      setSoapData(await res.json());
      setExams([]); // sugestões dependiam do SOAP confirmado
    } catch {
      setSoapError("Não foi possível rejeitar o prontuário. Tente novamente.");
    } finally {
      setSoapActionLoading(false);
    }
  }

  // ── Ações Exames ─────────────────────────────────────────────
  async function handleGenerateExams() {
    setExamError(null);
    setExamGenLoading(true);
    try {
      const res = await apiFetch(`/consultations/${id}/exam-suggestions`, { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(typeof e.detail === "string" ? e.detail : "Falha ao gerar sugestões.");
      }
      const body: { suggestions: ExamSuggestion[]; count: number } = await res.json();
      setExams(body.suggestions);
    } catch (err) {
      setExamError(err instanceof Error ? err.message : "Não foi possível gerar sugestões. Tente novamente.");
    } finally {
      setExamGenLoading(false);
    }
  }

  async function patchExam(suggestionId: string, patch: { status?: ExamStatus; exam_name?: string }) {
    const previous = exams;
    // Optimistic: atualiza local imediatamente.
    setExams((list) => list.map((s) => (s.id === suggestionId ? { ...s, ...patch } : s)));
    setExamSaving((s) => new Set(s).add(suggestionId));
    try {
      const res = await apiFetch(`/consultations/${id}/exam-suggestions/${suggestionId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const updated: ExamSuggestion = await res.json();
      setExams((list) => list.map((s) => (s.id === suggestionId ? updated : s)));
    } catch {
      setExams(previous); // reverte
      setExamError("Não foi possível salvar a alteração. Tente novamente.");
    } finally {
      setExamSaving((s) => {
        const next = new Set(s);
        next.delete(suggestionId);
        return next;
      });
    }
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manual.exam_name.trim() || !manual.justification.trim()) return;
    setExamError(null);
    setManualLoading(true);
    try {
      const res = await apiFetch(`/consultations/${id}/exam-suggestions/manual`, {
        method: "POST",
        body: JSON.stringify({ ...manual, hypothesis_ref: "Manual" }),
      });
      if (!res.ok) throw new Error();
      const created: ExamSuggestion = await res.json();
      setExams((list) => [...list, created]);
      setManual(EMPTY_MANUAL);
      setShowManual(false);
    } catch {
      setExamError("Não foi possível adicionar o exame. Tente novamente.");
    } finally {
      setManualLoading(false);
    }
  }

  const st = data ? (STATUS_MAP[data.status] ?? { label: data.status, tone: "slate" as const }) : null;
  const lines = data?.transcript ? data.transcript.split("\n").filter(Boolean) : [];
  const isInProgress = data?.status === "PENDING" || data?.status === "PROCESSING";
  const soapStatus = soapData?.soap_status;
  const canGenerateSoap = data?.status === "TRANSCRIBED" && !soapStatus;

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "9px 12px",
    font: "400 14px var(--ih-font-body)", color: "#191C1D", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, maxWidth: 860, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Voltar
        </Button>
        <h2 style={{ font: "700 22px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0, flex: 1 }}>
          Detalhes da consulta
        </h2>
        {!loading && data && canGenerateSoap && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateSOAP}
            disabled={soapGenLoading}
          >
            <Icon name="sparkles" size={14} color="#fff" />
            {soapGenLoading ? "Gerando…" : "Gerar SOAP"}
          </Button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ padding: 60, textAlign: "center", color: "#94A3B8", font: "400 14px var(--ih-font-body)" }}>
          Carregando consulta…
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          {/* Meta info card */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ font: "700 20px/1.2 var(--ih-font-display)", color: "#191C1D", marginBottom: 4 }}>
                  {data.patient_name || "Paciente não informado"}
                </div>
                <div style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280" }}>
                  {fmtDate(data.created_at)}
                </div>
              </div>
              {st && (
                <Pill tone={st.tone}>
                  {isInProgress && <LiveDot />}
                  {st.label}
                </Pill>
              )}
            </div>
          </Card>

          {/* Transcribed — show chat bubbles */}
          {data.status === "TRANSCRIBED" && (
            <Card padding={0}>
              <div style={{
                padding: "18px 24px",
                borderBottom: "1px solid #EAEDED",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <h3 style={{ font: "700 16px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>
                    Transcrição da consulta
                  </h3>
                  <p style={{ font: "400 12px/1.4 var(--ih-font-body)", color: "#94A3B8", margin: "4px 0 0" }}>
                    Identificação automática de locutores · AssemblyAI
                  </p>
                </div>
                <Pill tone="green">diarizado</Pill>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {lines.length > 0 ? (
                  lines.map((line, i) => <SpeakerBubble key={i} line={line} />)
                ) : (
                  <p style={{ font: "400 14px var(--ih-font-body)", color: "#94A3B8", textAlign: "center", margin: 0 }}>
                    Transcrição vazia.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* ── Seção SOAP (após transcrição) ──────────────────── */}
          {data.status === "TRANSCRIBED" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {soapError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 12, padding: "12px 16px", font: "400 13px var(--ih-font-body)" }}>
                  {soapError}
                </div>
              )}

              {/* Estado 1 — SOAP não gerado */}
              {!soapStatus && (
                <Card>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(46,204,113,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="file" size={20} color={GREEN} />
                      </div>
                      <div>
                        <div style={{ font: "700 15px var(--ih-font-body)", color: "#191C1D" }}>Prontuário SOAP</div>
                        <p style={{ font: "400 13px/1.5 var(--ih-font-body)", color: "#6B7280", margin: "2px 0 0" }}>
                          Gere o prontuário estruturado a partir da transcrição.
                        </p>
                      </div>
                    </div>
                    <Button variant="primary" size="sm" onClick={handleGenerateSOAP} disabled={soapGenLoading}>
                      <Icon name="sparkles" size={14} color="#fff" />
                      {soapGenLoading ? "Gerando prontuário…" : "Gerar Prontuário SOAP"}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Estado 2 — gerado: revisão */}
              {soapStatus === "generated" && soapData && (
                <>
                  <ClinicalDisclaimer type="soap" />
                  <SOAPViewer
                    soap={soapData.soap}
                    soapStatus="generated"
                    onConfirm={handleConfirmSOAP}
                    onReject={handleRejectSOAP}
                    loading={soapActionLoading}
                  />
                </>
              )}

              {/* Estado 3 — confirmado */}
              {soapStatus === "confirmed" && soapData && (
                <SOAPViewer
                  soap={soapData.soap}
                  soapStatus="confirmed"
                  onConfirm={handleConfirmSOAP}
                  onReject={handleRejectSOAP}
                  loading={soapActionLoading}
                />
              )}

              {/* Estado 4 — rejeitado */}
              {soapStatus === "rejected" && (
                <Card>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <p style={{ font: "400 14px/1.5 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
                      Prontuário rejeitado. Você pode gerar uma nova versão a partir da transcrição.
                    </p>
                    <Button variant="primary" size="sm" onClick={handleGenerateSOAP} disabled={soapGenLoading}>
                      <Icon name="sparkles" size={14} color="#fff" />
                      {soapGenLoading ? "Gerando…" : "Gerar novamente"}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── Seção Exames (só com SOAP confirmado) ──────────── */}
          {soapStatus === "confirmed" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {examError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 12, padding: "12px 16px", font: "400 13px var(--ih-font-body)" }}>
                  {examError}
                </div>
              )}

              {/* Estado 1 — sem sugestões */}
              {exams.length === 0 ? (
                <Card>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(46,204,113,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="activity" size={20} color={GREEN} />
                      </div>
                      <div>
                        <div style={{ font: "700 15px var(--ih-font-body)", color: "#191C1D" }}>Sugestão de exames</div>
                        <p style={{ font: "400 13px/1.5 var(--ih-font-body)", color: "#6B7280", margin: "2px 0 0" }}>
                          Sugestões assistivas a partir das hipóteses diagnósticas.
                        </p>
                      </div>
                    </div>
                    <Button variant="primary" size="sm" onClick={handleGenerateExams} disabled={examGenLoading}>
                      <Icon name="sparkles" size={14} color="#fff" />
                      {examGenLoading ? "Analisando hipóteses…" : "Sugerir Exames"}
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
                  <ClinicalDisclaimer type="exames" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {exams.map((s) => (
                      <ExamSuggestionCard
                        key={s.id}
                        suggestion={s}
                        loading={examSaving.has(s.id)}
                        onAccept={() => patchExam(s.id, { status: "aceito" })}
                        onReject={() => patchExam(s.id, { status: "rejeitado" })}
                        onUndo={() => patchExam(s.id, { status: "sugerido" })}
                        onEdit={(name) => patchExam(s.id, { exam_name: name })}
                      />
                    ))}
                  </div>

                  {/* Form manual inline */}
                  {showManual ? (
                    <Card>
                      <form onSubmit={handleAddManual} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ font: "700 14px var(--ih-font-body)", color: "#191C1D" }}>Adicionar exame manualmente</div>
                        <input
                          placeholder="Nome do exame"
                          value={manual.exam_name}
                          onChange={(e) => setManual({ ...manual, exam_name: e.target.value })}
                          style={inputStyle}
                          required
                        />
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <select
                            value={manual.category}
                            onChange={(e) => setManual({ ...manual, category: e.target.value as ExamCategory })}
                            style={{ ...inputStyle, width: "auto", flex: 1, minWidth: 160 }}
                          >
                            <option value="laboratorial">Laboratorial</option>
                            <option value="imagem">Imagem</option>
                            <option value="funcional">Funcional</option>
                            <option value="outro">Outro</option>
                          </select>
                          <select
                            value={manual.priority}
                            onChange={(e) => setManual({ ...manual, priority: e.target.value as ExamPriority })}
                            style={{ ...inputStyle, width: "auto", flex: 1, minWidth: 160 }}
                          >
                            <option value="alta">Prioridade alta</option>
                            <option value="media">Prioridade média</option>
                            <option value="baixa">Prioridade baixa</option>
                          </select>
                        </div>
                        <textarea
                          placeholder="Justificativa clínica"
                          value={manual.justification}
                          onChange={(e) => setManual({ ...manual, justification: e.target.value })}
                          style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                          required
                        />
                        <div style={{ display: "flex", gap: 10 }}>
                          <Button variant="primary" size="sm" type="submit" disabled={manualLoading}>
                            {manualLoading ? "Adicionando…" : "Adicionar"}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => { setShowManual(false); setManual(EMPTY_MANUAL); }}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </Card>
                  ) : (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <Button variant="ghost" size="sm" onClick={handleGenerateExams} disabled={examGenLoading}>
                        {examGenLoading ? "Analisando…" : "Regenerar sugestões"}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setShowManual(true)}>
                        <Icon name="plus" size={14} color="#191C1D" />
                        Adicionar exame manualmente
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Still processing */}
          {isInProgress && (
            <Card>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "rgba(46,204,113,.12)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name="activity" size={22} color="#2ECC71" />
                </div>
                <div>
                  <div style={{ font: "700 15px/1.2 var(--ih-font-body)", color: "#191C1D", marginBottom: 4 }}>
                    Transcrição em andamento
                  </div>
                  <p style={{ font: "400 13px/1.5 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
                    O áudio está sendo processado. Esta página atualiza automaticamente a cada 5 segundos.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Error */}
          {data.status === "ERROR" && (
            <Card>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "rgba(231,76,60,.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name="activity" size={22} color="#E74C3C" />
                </div>
                <div>
                  <div style={{ font: "700 15px/1.2 var(--ih-font-body)", color: "#191C1D", marginBottom: 4 }}>
                    Erro na transcrição
                  </div>
                  <p style={{ font: "400 13px/1.5 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
                    {data.error_msg || "Ocorreu um erro inesperado ao processar o áudio."}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
