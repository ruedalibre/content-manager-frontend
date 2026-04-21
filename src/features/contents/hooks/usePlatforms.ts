import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export type Platform = {
  id: string;
  name: string;
  slug: string;
};

export function usePlatforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platforms`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } },
        );
        const data = await res.json();
        setPlatforms(data ?? []);
      } catch (err) {
        console.error("Platforms fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { platforms, loading };
}
