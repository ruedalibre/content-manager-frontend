import { useState } from "react";
import { supabase } from "../../../supabaseClient";

export function useFormats() {
  const [loading, setLoading] = useState(false);

  const loadFormats = async (platformId: string): Promise<string[]> => {
    if (!platformId) return [];
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platform-formats?platform_id=${platformId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } },
      );
      const data = await res.json();
      return data ?? [];
    } catch (err) {
      console.error("Formats fetch error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { loading, loadFormats };
}
