"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/api";
import type { PatientListItem } from "@/lib/types";

const AVATAR_COLORS = ["#2ECC71", "#26A69A", "#3498DB", "#9B59B6", "#E67E22"];

function avatarColor(name: string): string {
  const sum = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function calcAge(dob: string | null): string | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} anos`;
}

const GENDER_LABEL: Record<string, string> = { M: "Masculino", F: "Feminino", O: "Outro" };

export default function PacientesPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const qs = debounced ? `?search=${encodeURIComponent(debounced)}` : "";
    apiFetch(`/patients${qs}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setPatients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debounced]);

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ font: "700 24px/1.2 var(--ih-font-display)", color: "#191C1D", margin: "0 0 4px" }}>
            Pacientes
          </h1>
          <p style={{ font: "400 14px/1.4 var(--ih-font-body)", color: "#6B7280", margin: 0 }}>
            {patients.length > 0
              ? `${patients.length} paciente${patients.length > 1 ? "s" : ""} cadastrado${patients.length > 1 ? "s" : ""}`
              : "Gerencie sua lista de pacientes"}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => router.push("/dashboard/pacientes/novo")}>
          <Icon name="plus" size={14} color="#fff" />
          Novo paciente
        </Button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 440 }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="search" size={16} color="#94A3B8" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome…"
          style={{
            width: "100%", padding: "10px 14px 10px 38px",
            borderRadius: 12, border: "1px solid #D1D5DB",
            font: "400 14px/1.5 var(--ih-font-body)", color: "#191C1D",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "#94A3B8", font: "400 14px var(--ih-font-body)" }}>
          Carregando pacientes…
        </div>
      )}

      {/* Empty */}
      {!loading && patients.length === 0 && (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Icon name="users" size={36} color="#CBD5E1" />
          <p style={{ font: "500 15px/1.5 var(--ih-font-body)", color: "#94A3B8", marginTop: 12, marginBottom: 0 }}>
            {debounced ? `Nenhum paciente encontrado para "${debounced}".` : "Nenhum paciente cadastrado ainda."}
          </p>
          {!debounced && (
            <Button variant="primary" size="sm" style={{ marginTop: 16 }} onClick={() => router.push("/dashboard/pacientes/novo")}>
              Cadastrar primeiro paciente
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && patients.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {patients.map((p) => (
            <Card
              key={p.id}
              padding={20}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/dashboard/pacientes/${p.id}`)}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <Avatar initials={initials(p.name)} size={52} color={avatarColor(p.name)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    font: "700 16px/1.2 var(--ih-font-display)", color: "#191C1D",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    marginBottom: 4,
                  }}>
                    {p.name}
                  </div>
                  <div style={{ font: "400 13px/1.4 var(--ih-font-body)", color: "#6B7280" }}>
                    {[calcAge(p.date_of_birth), p.gender ? GENDER_LABEL[p.gender] : null]
                      .filter(Boolean).join(" · ") || "Sem dados demográficos"}
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F2",
                  }}>
                    <div style={{ font: "500 12px/1.2 var(--ih-font-body)", color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                      {p.phone || p.email || "Sem contato cadastrado"}
                    </div>
                    <Icon name="chevronRight" size={16} color="#CBD5E1" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
