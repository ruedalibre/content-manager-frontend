import { type CreativeSession } from "../hooks/useIdeas.ts";

export default function StatusBadge({
  status,
}: {
  status: CreativeSession["status"];
}) {
  const map = {
    generated: { label: "Generated", cls: "recipe-status--generated" },
    reviewed: { label: "Approved", cls: "recipe-status--reviewed" },
    executed: { label: "Implemented", cls: "recipe-status--executed" },
    discarded: { label: "Discarded", cls: "recipe-status--discarded" },
  };
  const s = map[status] ?? map.generated;
  return <span className={`recipe-status ${s.cls}`}>{s.label}</span>;
}
