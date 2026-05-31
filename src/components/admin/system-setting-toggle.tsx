"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleSystemSettingAction } from "@/actions/admin.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  settingKey: string;
  initialValue: boolean;
  title: string;
  description: string;
}

export function SystemSettingToggle({ settingKey, initialValue, title, description }: Props) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(initialValue);

  const handleToggle = (newChecked: boolean) => {
    setChecked(newChecked);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("key", settingKey);
      formData.append("value", String(newChecked));
      
      const result = await toggleSystemSettingAction(formData);
      if (result.error) {
        toast.error(result.error);
        setChecked(!newChecked); // revert
      } else {
        toast.success(`${title} ${newChecked ? 'enabled' : 'disabled'}`);
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
      <div className="space-y-0.5">
        <Label className="text-base font-medium text-white">{title}</Label>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
        <Switch
          checked={checked}
          onCheckedChange={handleToggle}
          disabled={isPending}
          className="data-[state=checked]:bg-violet-600"
        />
      </div>
    </div>
  );
}
