"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { resetPassword } from "@/actions/auth.actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
      {pending ? "Sending..." : "Send Reset Link"}
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    const result = await resetPassword(formData);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(result.success);
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-white">Reset password</CardTitle>
        <CardDescription className="text-zinc-400">Enter your email and we&apos;ll send you a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /><div>{success}</div>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <SubmitButton />
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
