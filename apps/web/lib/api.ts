const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Token helpers ──────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function clearAuth() {
  localStorage.removeItem("access_token");
  // Remove o cookie usado pelo middleware
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Strict";
}

// ── Cliente HTTP autenticado ───────────────────────────────────

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  if (token && isTokenExpired(token)) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Token expirado");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Não autorizado");
  }

  return res;
}

// ── Upload multipart (áudio) — SCRUM-26 ───────────────────────
// Não definir Content-Type: o browser seta o boundary automaticamente

export async function apiUpload(
  path: string,
  formData: FormData
): Promise<Response> {
  const token = getToken();

  if (token && isTokenExpired(token)) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Token expirado");
  }

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Não autorizado");
  }

  return res;
}

// ── Salvar token (login + cadastro) ───────────────────────────
// Persiste no localStorage (client) e como cookie (middleware Next.js)

export function saveToken(token: string) {
  localStorage.setItem("access_token", token);
  // max-age=43200 = 12h (mesma expiração do JWT)
  document.cookie = `access_token=${token}; path=/; max-age=43200; SameSite=Strict`;
}

export function logout() {
  clearAuth();
  window.location.href = "/login";
}
