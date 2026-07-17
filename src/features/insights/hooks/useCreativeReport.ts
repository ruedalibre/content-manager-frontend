import { useState, useEffect } from "react";
import { apiFetch } from "../../../utils/apiClient";

export type CreativeReport = {
  identity: string;
  current_state: string;
  opportunity: string;
  question: string;
};

export function useCreativeReport(workspaceId: string | null) {
  const [report, setReport] = useState<CreativeReport | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar reporte existente al montar (o al cambiar de workspace)
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const loadExisting = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(
          `me-creative-report-get?workspace_id=${workspaceId}`,
        );
        const data = await res.json();
        if (data.exists) {
          setReport(data.report);
          setGeneratedAt(data.generated_at);
        } else {
          // Importante: limpiar estado al cambiar a un workspace sin reporte previo
          setReport(null);
          setGeneratedAt(null);
        }
      } catch (err) {
        console.error("Load report error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
  }, [workspaceId]);

  const generateReport = async (dna: unknown, forceRegenerate = false) => {
    if (!workspaceId) return;

    try {
      setGenerating(true);
      setError(null);
      const res = await apiFetch("me-creative-report", {
        method: "POST",
        body: JSON.stringify({
          dna,
          force_regenerate: forceRegenerate,
          workspace_id: workspaceId,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data.report);
      setGeneratedAt(data.generated_at);
    } catch (err) {
      console.error("Generate report error:", err);
      setError("Failed to generate report. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  return {
    report,
    generatedAt,
    loading,
    generating,
    error,
    generateReport,
  };
}
