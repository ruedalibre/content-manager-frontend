import { supabase } from "../supabaseClient";

const BASE_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return fetch(`${BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function trackDownload(
  eventType: 'brief' | 'report',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await apiFetch('me-track-download', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        metadata
      })
    })
  } catch {
    // Silent — never interrupt the download
  }
}
