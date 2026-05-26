import { useEffect, useState } from "react";
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

export function useSubscription() {
  const [subscription, setSubscription] =
    useState<Subscription>(DEFAULT_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-subscription`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );

        if (!res.ok) return;
        const data = await res.json();
        setSubscription(data);
      } catch (err) {
        console.error("Subscription load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Helpers de feature gating
  const canUseAI = subscription.is_creator || subscription.trial_active;
  const canCreateBriefs = subscription.is_creator || subscription.trial_active;

  return {
    subscription,
    loading,
    plan: subscription.plan,
    isCreator: subscription.is_creator,
    isFree: subscription.is_free,
    trialActive: subscription.trial_active,
    trialEndsAt: subscription.trial_ends_at,
    canUseAI,
    canCreateBriefs,
  };
}
