"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import LiveDot from "@/components/ui/LiveDot";
import Pill from "@/components/ui/Pill";
import SpeakerBubble from "@/components/ui/SpeakerBubble";
import { apiUpload, apiFetch } from "@/lib/api";
import type { ConsultationUploadResponse, ConsultationDetail, PatientListItem } from "@/lib/types";

// ── tipos de estado da página ─────────────────────────────────
type Stage = "form" | "recording" | "processing" | "done" | "error";

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function NovaConsultaPage() {
  const router = useRouter();

  // ── estado global da página ───────────────────────────────────
  const [stage, setStage] = useState<Stage>("form");
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liveText, setLiveText] = useState<string[]>([]);
  const [interimText, setInterimText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState(true);

  // ── refs de APIs do browser ───────────────────────────────────
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef         = useRef<Blob[]>([]);
  const streamRef         = useRef<MediaStream | null>(null);
  const recognitionRef    = useRef<SpeechRecognition | null>(null);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingActiveRef  = useRef(false); // guard contra requests concorrentes
  const pollAttemptsRef   = useRef(0);     // timeout: máx 72 tentativas × 5s = 6 min

  // ── limpa tudo ao desmontar ───────────────────────────────────
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      pollingRef.current && clearInterval(pollingRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.stop();
    };
  }, []);

  // ── iniciar gravação ──────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(500);
      mediaRecorderRef.current = recorder;

      // Timer
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      // Web Speech API — prévia ao vivo
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition: SpeechRecognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setLiveText((prev) => [...prev, t.trim()]);
              interim = "";
            } else {
              interim += t;
            }
          }
          setInterimText(interim);
        };
        // Reinicia automaticamente se o browser parar (timeout do Chrome)
        recognition.onend = () => {
          if (mediaRecorderRef.current?.state === "recording") recognition.start();
        };
        recognition.start();
        recognitionRef.current = recognition;
      } else {
        setSpeechAvailable(false);
      }

      setStage("recording");
    } catch {
      setErrorMsg("Não foi possível acessar o microfone. Verifique as permissões do browser.");
      setStage("error");
    }
  }

  // ── pausar / retomar ──────────────────────────────────────────
  function togglePause() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (paused) {
      recorder.resume();
      // onend reinicia o recognition automaticamente — só chama start() se não estiver rodando
      try { recognitionRef.current?.start(); } catch {}
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      recorder.pause();
      recognitionRef.current?.stop();
      timerRef.current && clearInterval(timerRef.current);
    }
    setPaused((p) => !p);
  }

  // ── finalizar e fazer upload ──────────────────────────────────
  async function finalize() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    // Para tudo
    timerRef.current && clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    setStage("processing");

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const form = new FormData();
    form.append("audio_file", blob, "consulta.webm");
    form.append("patient_consent", String(consent));
    if (patientName.trim()) form.append("patient_name", patientName.trim());
    if (patientId) form.append("patient_id", patientId);
    if (liveText.length > 0) form.append("live_transcript", liveText.join(" "));

    try {
      const res = await apiUpload("/consultations/upload", form);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.detail === "string" ? err.detail : "Erro ao enviar áudio.");
      }
      const data: ConsultationUploadResponse = await res.json();
      startPolling(data.consultation_id);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Erro ao enviar áudio. Tente novamente.");
      setStage("error");
    }
  }

  // ── polling de status ─────────────────────────────────────────
  function startPolling(id: string) {
    pollAttemptsRef.current = 0;
    pollingRef.current = setInterval(async () => {
      // guard: ignora tick se request anterior ainda está em curso
      if (pollingActiveRef.current) return;

      // timeout: 72 tentativas × 5s = 6 minutos máximo
      if (pollAttemptsRef.current >= 72) {
        clearInterval(pollingRef.current!);
        setErrorMsg("Tempo limite de transcrição atingido. Tente novamente mais tarde.");
        setStage("error");
        return;
      }

      pollingActiveRef.current = true;
      pollAttemptsRef.current += 1;

      try {
        const res = await apiFetch(`/consultations/${id}/status`);
        if (!res.ok) return;
        const data: ConsultationDetail = await res.json();
        if (data.status === "TRANSCRIBED") {
          clearInterval(pollingRef.current!);
          setTranscript(data.transcript);
          setStage("done");
        } else if (data.status === "ERROR") {
          clearInterval(pollingRef.current!);
          setErrorMsg(data.error_msg || "Erro ao transcrever o áudio.");
          setStage("error");
        }
      } catch {
        // erro de rede — tenta novamente no próximo tick
      } finally {
        pollingActiveRef.current = false;
      }
    }, 5000);
  }

  // ── renderização por stage ────────────────────────────────────

  if (stage === "form") return <FormStage
    patientName={patientName} setPatientName={setPatientName}
    patientId={patientId} setPatientId={setPatientId}
    consent={consent} setConsent={setConsent}
    onStart={startRecording}
  />;

  if (stage === "recording") return <RecordingStage
    elapsed={elapsed} paused={paused}
    patientName={patientName}
    liveText={liveText} interimText={interimText}
    speechAvailable={speechAvailable}
    onTogglePause={togglePause} onFinalize={finalize}
  />;

  if (stage === "processing") return <ProcessingStage />;

  if (stage === "done") return <DoneStage
    transcript={transcript} patientName={patientName}
    elapsed={elapsed} liveText={liveText}
    onBack={() => router.push("/dashboard")}
  />;

  if (stage === "error") return <ErrorStage
    message={errorMsg}
    onRetry={() => { setStage("form"); setElapsed(0); setLiveText([]); setInterimText(""); }}
  />;

  return null;
}

// ─────────────────────────────────────────────────────────────
// Sub-componentes de cada estágio
// ─────────────────────────────────────────────────────────────

// ── Seletor de paciente com busca ─────────────────────────────
function PatientSelect({ value, onChange }: {
  value: string;
  onChange: (name: string, id: string | null) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PatientListItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && query.length >= 2) {
      const t = setTimeout(() => {
        apiFetch(`/patients?search=${encodeURIComponent(query)}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((data: PatientListItem[]) => { setResults(data); setOpen(data.length > 0); });
      }, 300);
      return () => clearTimeout(t);
    }
    if (query.length < 2) { setResults([]); setOpen(false); }
  }, [query, selectedId]);

  function select(p: PatientListItem) {
    setQuery(p.name);
    setSelectedId(p.id);
    setOpen(false);
    onChange(p.name, p.id);
  }

  function clear() {
    setQuery("");
    setSelectedId(null);
    setResults([]);
    onChange("", null);
  }

  function calcAge(dob: string | null): string | null {
    if (!dob) return null;
    return `${Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))} anos`;
  }

  const baseInput: React.CSSProperties = {
    width: "100%", padding: "10px 14px", paddingRight: selectedId ? 36 : 14,
    borderRadius: 10, border: `1px solid ${selectedId ? "#2ECC71" : "#D1D5DB"}`,
    font: "400 14px/1.5 var(--ih-font-body)", color: "#191C1D",
    outline: "none", boxSizing: "border-box",
    background: selectedId ? "#EAFAF1" : "#fff",
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); if (selectedId) { setSelectedId(null); onChange(e.target.value, null); } else { onChange(e.target.value, null); } }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Buscar paciente cadastrado ou digitar nome"
        readOnly={!!selectedId}
        style={baseInput}
      />
      {selectedId && (
        <button
          onClick={clear}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#94A3B8",
            fontSize: 18, lineHeight: 1, padding: 2,
          }}
          title="Remover seleção"
        >×</button>
      )}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,.1)", zIndex: 200, overflow: "hidden",
        }}>
          {results.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => select(p)}
              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAF9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <span style={{ font: "600 14px/1.3 var(--ih-font-body)", color: "#191C1D" }}>{p.name}</span>
              {calcAge(p.date_of_birth) && (
                <span style={{ font: "400 12px/1 var(--ih-font-body)", color: "#94A3B8" }}>
                  {calcAge(p.date_of_birth)}
                </span>
              )}
            </div>
          ))}
          <a
            href="/dashboard/pacientes/novo"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 14px", borderTop: "1px solid #F1F5F2",
              font: "600 13px/1 var(--ih-font-body)", color: "#2ECC71",
              textDecoration: "none",
            }}
          >
            <Icon name="plus" size={13} color="#2ECC71" />
            Cadastrar novo paciente
          </a>
        </div>
      )}
    </div>
  );
}

function FormStage({ patientName, setPatientName, patientId, setPatientId, consent, setConsent, onStart }: {
  patientName: string; setPatientName: (v: string) => void;
  patientId: string | null; setPatientId: (v: string | null) => void;
  consent: boolean; setConsent: (v: boolean) => void;
  onStart: () => void;
}) {
  return (
    <div style={{ padding: 32, maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ font: "700 24px/1.2 var(--ih-font-display)", color: "#191C1D", marginBottom: 8 }}>
        Nova consulta
      </h2>
      <p style={{ font: "400 14px/1.6 var(--ih-font-body)", color: "#6B7280", marginBottom: 28 }}>
        Preencha os dados abaixo e clique em Iniciar. O software vai gravar e transcrever a consulta automaticamente.
      </p>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ font: "600 13px/1 var(--ih-font-body)", color: "#3D4A3E" }}>
              Paciente{" "}
              {patientId
                ? <span style={{ color: "#2ECC71", fontWeight: 400 }}>✓ cadastrado</span>
                : <span style={{ color: "#94A3B8", fontWeight: 400 }}>(opcional)</span>}
            </span>
            <PatientSelect
              value={patientName}
              onChange={(name, id) => { setPatientName(name); setPatientId(id); }}
            />
            {!patientId && (
              <span style={{ font: "400 12px/1.4 var(--ih-font-body)", color: "#94A3B8" }}>
                Selecione um paciente cadastrado ou simplesmente digite o nome.
              </span>
            )}
          </label>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: "#2ECC71", flexShrink: 0 }}
            />
            <span style={{ font: "400 13px/1.6 var(--ih-font-body)", color: "#3D4A3E" }}>
              Confirmo que o paciente consentiu com a gravação e transcrição desta consulta, conforme exigido pela <strong>LGPD (Art. 7)</strong>.
            </span>
          </label>

          <Button
            variant="primary"
            onClick={onStart}
            disabled={!consent}
            style={{ width: "100%", justifyContent: "center", opacity: consent ? 1 : 0.5 }}
          >
            <Icon name="mic" size={16} color="#fff" />
            Iniciar consulta
          </Button>
        </div>
      </Card>
    </div>
  );
}

function RecordingStage({ elapsed, paused, patientName, liveText, interimText, speechAvailable, onTogglePause, onFinalize }: {
  elapsed: number; paused: boolean; patientName: string;
  liveText: string[]; interimText: string; speechAvailable: boolean;
  onTogglePause: () => void; onFinalize: () => void;
}) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [liveText, interimText]);

  return (
    <div style={{ padding: 32, display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
      {/* Coluna principal */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header da gravação */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ font: "700 18px/1.2 var(--ih-font-display)", color: "#191C1D" }}>
                {patientName || "Paciente não informado"}
              </div>
              <div style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280", marginTop: 4 }}>
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
              {!paused && <Pill tone="green"><LiveDot />GRAVANDO</Pill>}
              {paused  && <Pill tone="slate">PAUSADO</Pill>}
              <span style={{ fontFamily: "var(--ih-font-mono)", fontWeight: 700, fontSize: 18, color: "#191C1D", letterSpacing: "1px" }}>
                {fmt(elapsed)}
              </span>
              <Button variant={paused ? "primary" : "danger"} size="sm" onClick={onTogglePause}>
                <Icon name={paused ? "mic" : "pause"} size={14} color={paused ? "#fff" : "#E74C3C"} />
                {paused ? "Retomar" : "Pausar"}
              </Button>
              <Button variant="dark" size="sm" onClick={onFinalize}>
                <Icon name="check" size={14} color="#fff" />
                Finalizar
              </Button>
            </div>
          </div>
        </Card>

        {/* Transcrição ao vivo */}
        <Card padding={0}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #EAEDED", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ font: "700 16px/1.2 var(--ih-font-display)", color: "#191C1D", margin: 0 }}>
                Prévia ao vivo
              </h3>
              <p style={{ font: "400 12px/1.4 var(--ih-font-body)", color: "#94A3B8", margin: "3px 0 0" }}>
                {speechAvailable
                  ? "Transcrição precisa e diarizada disponível ao finalizar"
                  : "Browser sem suporte a Web Speech API — áudio sendo gravado normalmente"}
              </p>
            </div>
            {!paused && <Pill tone="green"><LiveDot />ao vivo</Pill>}
          </div>
          <div style={{ padding: 24, minHeight: 200, maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {liveText.length === 0 && !interimText && (
              <p style={{ font: "400 13px/1.6 var(--ih-font-body)", color: "#CBD5E1", textAlign: "center", marginTop: 40 }}>
                {speechAvailable ? "Aguardando fala…" : "Gravando áudio…"}
              </p>
            )}
            {liveText.map((t, i) => (
              <p key={i} style={{ font: "400 14px/1.6 var(--ih-font-body)", color: "#3D4A3E", margin: 0 }}>{t}</p>
            ))}
            {interimText && (
              <p style={{ font: "400 14px/1.6 var(--ih-font-body)", color: "#94A3B8", margin: 0, fontStyle: "italic" }}>
                {interimText}
              </p>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </Card>
      </div>

      {/* Coluna lateral */}
      <div style={{ position: "sticky", top: 24 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Icon name="sparkles" size={18} color="#2ECC71" />
            <span style={{ font: "700 11px/1 var(--ih-font-body)", letterSpacing: "1.2px", color: "#3D4A3E", textTransform: "uppercase" }}>
              O que acontece ao finalizar
            </span>
          </div>
          {[
            { icon: "mic" as const,      title: "Áudio enviado",         body: "O áudio gravado é enviado de forma segura para o servidor." },
            { icon: "activity" as const, title: "Transcrição precisa",    body: "WhisperX transcreve em pt-BR com identificação automática de MÉDICO e PACIENTE." },
            { icon: "sparkles" as const, title: "Relatório pronto",       body: "A transcrição completa fica disponível no histórico em alguns minutos." },
          ].map((ins, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: 14, borderRadius: 12, background: "#FBFCFC", border: "1px solid rgba(187,203,187,.2)", marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(46,204,113,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={ins.icon} size={16} color="#2ECC71" />
              </div>
              <div>
                <div style={{ font: "700 13px/1.3 var(--ih-font-body)", color: "#191C1D", marginBottom: 3 }}>{ins.title}</div>
                <div style={{ font: "400 12px/1.5 var(--ih-font-body)", color: "#3D4A3E" }}>{ins.body}</div>
              </div>
            </div>
          ))}
          <Button variant="dark" size="sm" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={onFinalize}>
            <Icon name="check" size={14} color="#fff" />
            Finalizar consulta
          </Button>
        </Card>
      </div>
    </div>
  );
}

function ProcessingStage() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(46,204,113,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="activity" size={32} color="#2ECC71" />
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ font: "700 22px/1.2 var(--ih-font-display)", color: "#191C1D", margin: "0 0 8px" }}>
          Transcrevendo consulta{dots}
        </h2>
        <p style={{ font: "400 14px/1.6 var(--ih-font-body)", color: "#6B7280", maxWidth: 420, margin: 0 }}>
          O WhisperX está processando o áudio em pt-BR e identificando MÉDICO e PACIENTE.
          Isso pode levar alguns minutos dependendo da duração da consulta.
        </p>
      </div>
      <div style={{ width: 320, height: 4, borderRadius: 4, background: "#F1F5F2", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4, background: "#2ECC71",
          animation: "progressPulse 1.8s ease-in-out infinite",
          width: "60%",
        }} />
      </div>
      <style>{`@keyframes progressPulse { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }`}</style>
    </div>
  );
}

function DoneStage({ transcript, liveText, patientName, elapsed, onBack }: {
  transcript: string | null; liveText: string[]; patientName: string; elapsed: number; onBack: () => void;
}) {
  const [showLive, setShowLive] = useState(false);
  const apiLines = (transcript || "").split("\n").filter(Boolean);
  const hasApiTranscript = apiLines.length > 0;

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, maxWidth: 860, margin: "0 auto" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ font: "700 24px/1.2 var(--ih-font-display)", color: "#191C1D", margin: "0 0 4px" }}>
            Transcrição concluída
          </h2>
          <p style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
            {patientName || "Paciente não informado"} · Duração: {fmt(elapsed)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="ghost" size="sm" onClick={onBack}>Voltar ao dashboard</Button>
          <Button variant="primary" size="sm" disabled style={{ opacity: 0.5 }} title="Em breve — Sprint 3">
            <Icon name="sparkles" size={14} color="#fff" />
            Gerar SOAP
          </Button>
        </div>
      </div>

      {/* Transcrição diarizada — conteúdo principal */}
      <Card padding={0}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #EAEDED", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          {hasApiTranscript ? (
            apiLines.map((line, i) => <SpeakerBubble key={i} line={line} />)
          ) : (
            <p style={{ font: "400 14px/1.6 var(--ih-font-body)", color: "#94A3B8", margin: 0, textAlign: "center" }}>
              Transcrição não disponível.
            </p>
          )}
        </div>
      </Card>

      {/* Prévia ao vivo — colapsável, secundária */}
      {liveText.length > 0 && (
        <div>
          <button
            onClick={() => setShowLive(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}
          >
            <span style={{ font: "400 12px/1 var(--ih-font-body)", color: "#94A3B8" }}>
              {showLive ? "▲" : "▼"} Prévia ao vivo (Web Speech API)
            </span>
          </button>
          {showLive && (
            <div style={{ marginTop: 12, padding: "16px 20px", background: "#F8FAFB", borderRadius: 12, border: "1px solid #E7E9EB" }}>
              <p style={{ font: "400 13px/1.8 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
                {liveText.join(" ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorStage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(231,76,60,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="activity" size={32} color="#E74C3C" />
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ font: "700 20px/1.2 var(--ih-font-display)", color: "#191C1D", margin: "0 0 8px" }}>
          Algo deu errado
        </h2>
        <p style={{ font: "400 14px/1.6 var(--ih-font-body)", color: "#6B7280", maxWidth: 400, margin: 0 }}>
          {message}
        </p>
      </div>
      <Button variant="primary" onClick={onRetry}>Tentar novamente</Button>
    </div>
  );
}
