import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../../../supabaseClient.ts";

export type SubscriptionPlan = "free" | "creator";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export type Subscription = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_active: boolean;
  is_creator: boolean;
  is_free: boolean;
};

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: "free",
  status: "active",
  trial_ends_at: null,
  current_period_end: null,
  cancel_at_period_end: false,
  trial_active: false,
  is_creator: false,
  is_free: true,
};

type SubscriptionContextValue = {
  subscription: Subscription;
  loading: boolean;
  plan: SubscriptionPlan;
  isCreator: boolean;
  isFree: boolean;
  trialActive: boolean;
  trialEndsAt: string | null;
  canUseAI: boolean;
  canCreateBriefs: boolean;
  canCreateWorkspace: boolean;
  loadSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] =
    useState<Subscription>(DEFAULT_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-subscription`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSubscription(data);
    } catch (err) {
      console.error("Subscription load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const canUseAI = subscription.is_creator || subscription.trial_active;
  const canCreateBriefs = subscription.is_creator || subscription.trial_active;
  const canCreateWorkspace = subscription.is_creator;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        plan: subscription.plan,
        isCreator: subscription.is_creator,
        isFree: subscription.is_free,
        trialActive: subscription.trial_active,
        trialEndsAt: subscription.trial_ends_at,
        canUseAI,
        canCreateBriefs,
        canCreateWorkspace,
        loadSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return ctx;
}