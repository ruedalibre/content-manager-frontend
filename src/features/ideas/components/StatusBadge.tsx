import { useTranslation } from "react-i18next";
import { type CreativeSession } from "../hooks/useIdeas.ts";

export default function StatusBadge({
  status,
}: {
  status: CreativeSession["status"];
}) {
  const { t } = useTranslation();
  const map = {
    generated: { label: t("status.generated"), cls: "recipe-status--generated" },
    reviewed: { label: t("status.approved"), cls: "recipe-status--reviewed" },
    executed: { label: t("status.implemented"), cls: "recipe-status--executed" },
    discarded: { label: t("status.discarded"), cls: "recipe-status--discarded" },
  };
  const s = map[status] ?? map.generated;
  return <span className={`recipe-status ${s.cls}`}>{s.label}</span>;
}
