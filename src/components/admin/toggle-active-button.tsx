"use client";

import { Button } from "@/components/ui/button";
import { toggleUserActiveAction } from "@/actions/admin.actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, UserCheck, UserX } from "lucide-react";

interface Props {
  userId: string;
  isActive: boolean;
}

export function ToggleActiveButton({ userId, isActive }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const formData = new FormData();
    formData.set("user_id", userId);
    formData.set("is_active", String(isActive));
    const result = await toggleUserActiveAction(formData);
    if (result.error) toast.error(result.error);
    else toast.success(isActive ? "User deactivated" : "User activated");
    setLoading(false);
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      size="sm"
      variant="ghost"
      className={isActive ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        <><UserX className="h-4 w-4 mr-1" /> Deactivate</>
      ) : (
        <><UserCheck className="h-4 w-4 mr-1" /> Activate</>
      )}
    </Button>
  );
}
