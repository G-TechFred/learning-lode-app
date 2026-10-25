import { useEffect, useState } from "react";
import { LOCAL_DATA_UPDATED } from "@/lib/local-data";
import { fetchPerformance, type PerformanceRecord } from "@/lib/performance";

export function useLocalPerformance(studentId: number | null, term: string, academicYear: string) {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId == null) {
      setRecords([]);
      setLoading(false);
      return;
    }

    let active = true;
    const load = () => {
      setLoading(true);
      setError(null);
      fetchPerformance(studentId, term, academicYear)
        .then((nextRecords) => {
          if (active) setRecords(nextRecords);
        })
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : "Failed to load local demo records.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    load();
    window.addEventListener(LOCAL_DATA_UPDATED, load);
    window.addEventListener("storage", load);

    return () => {
      active = false;
      window.removeEventListener(LOCAL_DATA_UPDATED, load);
      window.removeEventListener("storage", load);
    };
  }, [studentId, term, academicYear]);

  return { records, loading, error };
}
