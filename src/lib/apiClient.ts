// API Base URL Manager
export const getCustomApiUrl = (): string => {
  const url = localStorage.getItem('bodima_custom_api_url') || import.meta.env.VITE_API_BASE_URL || '';
  return url.trim().replace(/\/+$/, '');
};

export const saveCustomApiUrl = (url: string) => {
  if (url.trim()) {
    localStorage.setItem('bodima_custom_api_url', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('bodima_custom_api_url');
  }
};

export const apiFetch = (endpoint: string, init?: RequestInit): Promise<Response> => {
  const customUrl = getCustomApiUrl();
  const url = customUrl ? `${customUrl}${endpoint}` : endpoint;
  return fetch(url, init);
};
