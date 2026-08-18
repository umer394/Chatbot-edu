const TOKEN_COOKIE = "token";
const MAX_AGE_SECONDS = 3600;
const SECURE = process.env.NODE_ENV === "production" ? "; secure" : "";

export function setAuthToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax${SECURE}`;
}

export function clearAuthToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax${SECURE}`;
}
