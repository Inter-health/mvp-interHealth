"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { logout as apiLogout } from "@/lib/api";

const navMain = [
  { href: "/dashboard",             label: "Dashboard",      icon: "dashboard" as const },
  { href: "/dashboard/pacientes",   label: "Pacientes",      icon: "users" as const },
  { href: "/dashboard/prontuario",  label: "Prontuário",     icon: "file" as const },
  { href: "/dashboard/nova-consulta", label: "Consulta Ativa", icon: "mic" as const },
];

const navGestao = [
  { href: "/dashboard/arquivo",      label: "Arquivo",        icon: "calendar" as const },
  { href: "/dashboard/configuracoes",label: "Configurações",  icon: "settings" as const },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isNovaConsulta = pathname.startsWith("/dashboard/nova-consulta");

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside style={{
      width: 232,
      minHeight: "100vh",
      background: "#fff",
      borderRight: "1px solid #EAEDED",
      padding: "20px 16px",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", marginBottom: 24 }}>
        <Image
          src="/miniLogoInterHealth.png"
          alt="InterHealth"
          width={32}
          height={32}
          style={{ flexShrink: 0 }}
        />
        <div>
          <div style={{ font: "700 16px/1 var(--ih-font-display)", color: "#0F172A", letterSpacing: "-.3px" }}>InterHealth</div>
          <div style={{ font: "700 10px/1 var(--ih-font-display)", color: "#2ECC71", letterSpacing: ".5px", marginTop: 3 }}>CLÍNICO</div>
        </div>
      </div>

      {/* Nova Consulta CTA */}
      <button
        onClick={() => router.push("/dashboard/nova-consulta")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          margin: "0 0 16px",
          padding: "11px 14px",
          fontFamily: "var(--ih-font-body)",
          fontWeight: 700,
          fontSize: 14,
          color: isNovaConsulta ? "#2ECC71" : "#fff",
          background: isNovaConsulta ? "#EAFAF1" : "#2ECC71",
          border: isNovaConsulta ? "1px solid #2ECC71" : "1px solid transparent",
          borderRadius: 12,
          cursor: "pointer",
          width: "100%",
          transition: "all .15s",
        }}
      >
        <Icon name="plus" size={16} color={isNovaConsulta ? "#2ECC71" : "#fff"}/>
        Nova consulta
      </button>

      {/* Main nav */}
      <div style={{ font: "700 10px/1 var(--ih-font-body)", color: "#94A3B8", letterSpacing: "1px", padding: "14px 10px 6px", textTransform: "uppercase" }}>
        Painel
      </div>
      {navMain.map(item => (
        <Link key={item.href} href={item.href} style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          fontFamily: "var(--ih-font-body)",
          fontWeight: isActive(item.href) ? 700 : 500,
          fontSize: 14,
          color: isActive(item.href) ? "#2ECC71" : "#556158",
          textDecoration: "none",
          borderRadius: 12,
          marginBottom: 4,
          background: isActive(item.href) ? "#EAFAF1" : "transparent",
          border: isActive(item.href) ? "1px solid #2ECC71" : "1px solid transparent",
          transition: "all .15s",
        }}>
          <Icon name={item.icon} size={18} color={isActive(item.href) ? "#2ECC71" : "#556158"}/>
          {item.label}
        </Link>
      ))}

      {/* Gestão nav */}
      <div style={{ font: "700 10px/1 var(--ih-font-body)", color: "#94A3B8", letterSpacing: "1px", padding: "14px 10px 6px", textTransform: "uppercase" }}>
        Gestão
      </div>
      {navGestao.map(item => (
        <Link key={item.href} href={item.href} style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          fontFamily: "var(--ih-font-body)",
          fontWeight: isActive(item.href) ? 700 : 500,
          fontSize: 14,
          color: isActive(item.href) ? "#2ECC71" : "#556158",
          textDecoration: "none",
          borderRadius: 12,
          marginBottom: 4,
          background: isActive(item.href) ? "#EAFAF1" : "transparent",
          border: isActive(item.href) ? "1px solid #2ECC71" : "1px solid transparent",
          transition: "all .15s",
        }}>
          <Icon name={item.icon} size={18} color={isActive(item.href) ? "#2ECC71" : "#556158"}/>
          {item.label}
        </Link>
      ))}

      {/* Spacer + logout */}
      <div style={{ flex: 1 }}/>
      <button
        onClick={() => { apiLogout(); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          fontFamily: "var(--ih-font-body)",
          fontWeight: 500,
          fontSize: 14,
          color: "#E74C3C",
          background: "transparent",
          border: "1px solid transparent",
          borderRadius: 12,
          cursor: "pointer",
          width: "100%",
          transition: "all .15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#FECACA";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
        }}
      >
        <Icon name="logout" size={18} color="#E74C3C"/>
        Sair da conta
      </button>
    </aside>
  );
}
