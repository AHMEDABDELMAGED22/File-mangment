"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteUserDialog } from "./delete-user-dialog";

interface Props {
  userId: string;
  userName: string;
  disabled?: boolean;
}

export function DeleteUserButton({ userId, userName, disabled }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        size="sm"
        variant="ghost"
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
        title="Permanently delete account"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DeleteUserDialog
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        userName={userName}
      />
    </>
  );
}
