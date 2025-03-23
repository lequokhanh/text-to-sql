import { paths } from 'src/routes/paths';

// API
// ----------------------------------------------------------------------

export const BACKEND_HOST_API = import.meta.env.VITE_BACKEND_HOST_API;
export const EMBED_HOST_API = import.meta.env.VITE_EMBED_HOST_API;
export const ENGINE_HOST_API = import.meta.env.VITE_ENGINE_HOST_API;
export const ASSETS_API = import.meta.env.VITE_ASSETS_API;

// ROOT PATH AFTER LOGIN SUCCESSFUL
export const PATH_AFTER_LOGIN = paths.dashboard.root; // as '/dashboard'
