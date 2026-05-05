"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signUp } from "@/actions/auth.actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, CheckCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 transition-all duration-200" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
      {pending ? "Creating account..." : "Create Account"}
    </Button>
  );
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    const result = await signUp(formData);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(result.success);
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-white">Create an account</CardTitle>
        <CardDescription className="text-zinc-400">Get started with your secure file workspace</CardDescription>
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
              <Label htmlFor="full_name" className="text-zinc-300">Full Name</Label>
              <Input id="full_name" name="full_name" type="text" placeholder="John Doe" required className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-zinc-300">Confirm Password</Label>
              <Input id="confirm_password" name="confirm_password" type="password" placeholder="••••••••" required className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <SubmitButton />
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign in</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
