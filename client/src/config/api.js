const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Prevent double /api when VITE_API_URL already includes it
const API_URL = raw.replace(/\/api\/?$/, '').replace(/\/$/, '');

export default API_URL;
