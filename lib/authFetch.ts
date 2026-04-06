import { getAuth } from "firebase/auth";

export async function authFetch(url: string, options: RequestInit = {}) {
    const token = await getAuth().currentUser?.getIdToken();
    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}