"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, updatePassword } from "@/actions/auth.actions";
import { linkMyStudentCodeAction, getMyGradeAction } from "@/actions/grade.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Lock, Link2, Hash } from "lucide-react";
import { toast } from "sonner";

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

function PasswordBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
      {pending ? "Updating..." : "Update Password"}
    </Button>
  );
}

function LinkCodeBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
      {pending ? "Linking..." : "Link Code"}
    </Button>
  );
}

export default function SettingsPage() {
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [linkedCode, setLinkedCode] = useState<string | null>(null);

  useEffect(() => {
    getMyGradeAction()
      .then((result) => setLinkedCode(result.gradeData?.student_code ?? null))
      .catch(() => setLinkedCode(null));
  }, []);

  async function handleProfile(formData: FormData) {
    setProfileError(null);
    const result = await updateProfile(formData);
    if (result?.error) { setProfileError(result.error); toast.error(result.error); }
    if (result?.success) toast.success(result.success);
  }

  async function handlePassword(formData: FormData) {
    setPasswordError(null);
    const result = await updatePassword(formData);
    if (result?.error) { setPasswordError(result.error); toast.error(result.error); }
    if (result?.success) toast.success(result.success);
  }

  async function handleCodeLink(formData: FormData) {
    setCodeError(null);
    const result = await linkMyStudentCodeAction(formData);
    if (result?.error) {
      setCodeError(result.error);
      toast.error(result.error);
      return;
    }
    if (result?.success) {
      const latest = await getMyGradeAction();
      setLinkedCode(latest.gradeData?.student_code ?? null);
      toast.success(result.success);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Profile</CardTitle>
          <CardDescription className="text-zinc-400">Update your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProfile} className="space-y-4">
            {profileError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{profileError}</div>}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-zinc-300">Full Name</Label>
              <Input id="full_name" name="full_name" placeholder="Your name" required className="bg-zinc-800/50 border-zinc-700 text-white focus:border-violet-500" />
            </div>
            <SaveBtn />
          </form>
        </CardContent>
      </Card>

      <Separator className="bg-zinc-800" />

      {/* Password */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Change Password</CardTitle>
          <CardDescription className="text-zinc-400">Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handlePassword} className="space-y-4">
            {passwordError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{passwordError}</div>}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">New Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} className="bg-zinc-800/50 border-zinc-700 text-white focus:border-violet-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-zinc-300">Confirm Password</Label>
              <Input id="confirm_password" name="confirm_password" type="password" placeholder="••••••••" required className="bg-zinc-800/50 border-zinc-700 text-white focus:border-violet-500" />
            </div>
            <PasswordBtn />
          </form>
        </CardContent>
      </Card>

      <Separator className="bg-zinc-800" />

      {/* Grade Code */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Link Student Code</CardTitle>
          <CardDescription className="text-zinc-400">Enter your code here if you skipped it during signup</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleCodeLink} className="space-y-4">
            {codeError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{codeError}</div>}
            {linkedCode && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Currently linked code: <span className="font-mono font-semibold">{linkedCode}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="student_code" className="text-zinc-300">Student Code</Label>
              <Input
                id="student_code"
                name="student_code"
                placeholder="Enter your code"
                className="bg-zinc-800/50 border-zinc-700 text-white focus:border-amber-500 font-mono"
              />
            </div>
            <LinkCodeBtn />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
