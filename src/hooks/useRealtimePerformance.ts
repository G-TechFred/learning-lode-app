import { useEffect, useState } from "react";
import { supabase } from "@/integrations/external-supabase/client";
import { fetchPerformance, type PerformanceRecord } from "@/lib/performance";

/**
 * Live per-student performance records.
 * Loads the current rows, then keeps them in sync through a Realtime channel
 * so student/parent screens update the moment a teacher saves a change.
 */
export function useRealtimePerformance(
  studentId: number | null,
  term: string,
  academicYear: string,
) {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId == null) {
      setRecords([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchPerformance(studentId, term, academicYear)
      .then((rows) => {
        if (active) setRecords(rows);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Failed to load performance");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const channel = supabase
      .channel(`student-performance-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_performance",
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          if (!active) return;
          const next = payload.new as PerformanceRecord | null;
          const previous = payload.old as { id?: string } | null;

          setRecords((current) => {
            if (payload.eventType === "DELETE") {
              return current.filter((r) => r.id !== previous?.id);
            }
            if (!next) return current;
            if (next.term !== term || next.academic_year !== academicYear) {
              return current.filter((r) => r.id !== next.id);
            }
            const index = current.findIndex((r) => r.id === next.id);
            if (index === -1) return [...current, next];
            const copy = [...current];
            copy[index] = next;
            return copy;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [studentId, term, academicYear]);

  return { records, loading, error };
}
