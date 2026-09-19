// Тот же сервер, что у веб-Киры: https://api.kira-ai.online
window.MF_CONFIG = {
  BACKEND_URL:
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:8788"
      : "https://api.kira-ai.online",
  TIMEOUT_MS: 75000,
};
