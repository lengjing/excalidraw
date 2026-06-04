/// <reference types="vite-plugin-svgr/client" />
interface ImportMetaEnv {
  VITE_APP_PORT: string;
  VITE_APP_BACKEND_V2_GET_URL: string;
  VITE_APP_BACKEND_V2_POST_URL: string;
  VITE_APP_WS_SERVER_URL: string;
  VITE_APP_PORTAL_URL: string;
  VITE_APP_AI_BACKEND: string;
  VITE_APP_FIREBASE_CONFIG: string;
  VITE_APP_DEV_DISABLE_LIVE_RELOAD: string;
  VITE_APP_DISABLE_SENTRY: string;
  VITE_APP_COLLAPSE_OVERLAY: string;
  VITE_APP_ENABLE_ESLINT: string;
  VITE_APP_ENABLE_PWA: string;
  VITE_APP_PLUS_LP: string;
  VITE_APP_PLUS_APP: string;
  VITE_APP_GIT_SHA: string;
  MODE: string;
  DEV: string;
  PROD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
