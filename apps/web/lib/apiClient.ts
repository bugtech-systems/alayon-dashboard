// lib/apiClient.ts


const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

export async function apiFetch(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem('token');
    let session_id = localStorage.getItem('session_id');


  return fetch(`${BASE_URL}${url}`, {
    ...options,
    credentials: "include", // 👈 this is your "token"
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}`} : {}),
      ...(options.headers || {}),
    },
  })
}