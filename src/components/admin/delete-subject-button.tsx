"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteSubjectAction } from "@/actions/grade.actions";
import { useRouter } from "next/navigation";

export function DeleteSubjectButton({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${subjectName}? This will permanently delete all grades for this subject.`)) {
      return;
    }
    setLoading(true);
    const res = await deleteSubjectAction(subjectId);
    if (!res.error) {
      router.refresh();
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
