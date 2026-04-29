// lib/apiClient.ts


const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

export async function apiFetch(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem('token');

    console.log(token, 'TOKENED')

  return fetch(`${BASE_URL}${url}`, {
    ...options,
    credentials: "include", // 👈 this is your "token"
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
}