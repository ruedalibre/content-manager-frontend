import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

export type UserProfile = {
  id: string;
  user_id: string;
  tenant_id: string;
  time_availability: string | null;
  production_setup: string | null;
  idea_sources: string[];
  referents: string | null;
  archetype: string | null;
  archetype_confidence: number;
  preferred_output_format: string | null;
  dominant_need: string | null;
  creative_process_style: string | null;
  onboarding_completed: boolean;
  onboarding_skipped: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type OnboardingData = {
  time_availability?: string;
  production_setup?: string;
  idea_sources?: string[];
  referents?: string;
  onboarding_completed?: boolean;
  onboarding_skipped?: boolean;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  };

  const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  /* =========================
     LOAD PROFILE
  ========================= */

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await getSession();
      const res = await fetch(`${base}/me-user-profile`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to load profile");

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CREATE PROFILE
  ========================= */

  const createProfile = async (data: OnboardingData) => {
    const session = await getSession();
    const res = await fetch(`${base}/create-user-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to create profile");
    }

    await loadProfile();
  };

  /* =========================
     UPDATE PROFILE
  ========================= */

  const updateProfile = async (data: Partial<UserProfile>) => {
    const session = await getSession();
    const res = await fetch(`${base}/update-user-profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to update profile");
    }

    await loadProfile();
  };

  /* =========================
     SKIP ONBOARDING
  ========================= */

  const skipOnboarding = async () => {
    try {
      if (profile) {
        await updateProfile({ onboarding_skipped: true });
      } else {
        await createProfile({ onboarding_skipped: true });
      }
    } catch (err) {
      console.error("Skip onboarding error:", err);
    }
  };

  /* =========================
     COMPLETE ONBOARDING
  ========================= */

  const completeOnboarding = async (data: OnboardingData) => {
    try {
      if (profile) {
        await updateProfile({ ...data, onboarding_completed: true });
      } else {
        await createProfile({ ...data, onboarding_completed: true });
      }
    } catch (err) {
      console.error("Complete onboarding error:", err);
      throw err;
    }
  };

  /* =========================
     NEEDS ONBOARDING
  ========================= */

  const needsOnboarding =
    !loading &&
    profile !== null &&
    !profile.onboarding_completed &&
    !profile.onboarding_skipped;

  const isFirstSession = !loading && profile === null;

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    needsOnboarding,
    isFirstSession,
    loadProfile,
    createProfile,
    updateProfile,
    skipOnboarding,
    completeOnboarding,
  };
}
