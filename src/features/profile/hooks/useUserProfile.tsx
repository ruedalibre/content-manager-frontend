import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../../../supabaseClient.ts";

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
  tour_status: 'pending' | 'completed' | 'dismissed' | null;
  preferred_language: 'en' | 'es' | null;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  country_code: string | null;
  timezone: string | null;
  creator_role: string | null;
  profile_nudge_dismissed_at: string | null;
};

export type OnboardingData = {
  time_availability?: string;
  production_setup?: string;
  idea_sources?: string[];
  referents?: string;
  onboarding_completed?: boolean;
  onboarding_skipped?: boolean;
};

type UserProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  isFirstSession: boolean;
  showTourInvitation: boolean;
  showProfileNudge: boolean;
  dismissProfileNudge: () => Promise<void>;
  loadProfile: () => Promise<void>;
  createProfile: (data: OnboardingData) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  updateTourStatus: (status: 'completed' | 'dismissed') => Promise<void>;
  updateLanguage: (lang: 'en' | 'es') => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(
  null,
);

export function UserProfileProvider({ children }: { children: ReactNode }) {
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

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${base}/me-user-profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
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
  }, []);

  const createProfile = useCallback(
    async (data: OnboardingData) => {
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
    },
    [loadProfile],
  );

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
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
    },
    [loadProfile],
  );

  const skipOnboarding = useCallback(async () => {
    try {
      if (profile) {
        await updateProfile({ onboarding_skipped: true });
      } else {
        await createProfile({ onboarding_skipped: true });
      }
    } catch (err) {
      console.error("Skip onboarding error:", err);
    }
  }, [profile, updateProfile, createProfile]);

  const completeOnboarding = useCallback(
    async (data: OnboardingData) => {
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
    },
    [profile, updateProfile, createProfile],
  );

  const updateTourStatus = useCallback(
    async (status: 'completed' | 'dismissed') => {
      try {
        await updateProfile({ tour_status: status } as Partial<UserProfile>);
      } catch (err) {
        console.error("Tour status update error:", err);
      }
    },
    [updateProfile],
  );

  const updateLanguage = useCallback(
    async (lang: 'en' | 'es') => {
      try {
        await updateProfile({
          preferred_language: lang,
        } as Partial<UserProfile>);
      } catch (err) {
        console.error("Language update error:", err);
      }
    },
    [updateProfile],
  );

  function isProfileComplete(p: UserProfile): boolean {
    return !!(p.display_name && p.country_code && p.creator_role);
  }

  const needsOnboarding =
    !loading &&
    profile !== null &&
    !profile.onboarding_completed &&
    !profile.onboarding_skipped;

  const isFirstSession = !loading && profile === null;

  const showTourInvitation =
    !loading &&
    profile !== null &&
    (profile.onboarding_completed || profile.onboarding_skipped) &&
    (profile.tour_status === 'pending' || profile.tour_status === null);

  const showProfileNudge = Boolean(
    !loading &&
      profile !== null &&
      (profile.onboarding_completed || profile.onboarding_skipped) &&
      profile.profile_nudge_dismissed_at === null &&
      !isProfileComplete(profile) &&
      new Date(profile.created_at) <
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  const dismissProfileNudge = useCallback(async () => {
    try {
      await updateProfile({
        profile_nudge_dismissed_at: new Date().toISOString(),
      } as Partial<UserProfile>);
    } catch (err) {
      console.error("Dismiss nudge error:", err);
    }
  }, [updateProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        needsOnboarding,
        isFirstSession,
        showTourInvitation,
        showProfileNudge,
        dismissProfileNudge,
        loadProfile,
        createProfile,
        updateProfile,
        skipOnboarding,
        completeOnboarding,
        updateTourStatus,
        updateLanguage,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error(
      "useUserProfile must be used within a UserProfileProvider",
    );
  }
  return ctx;
}