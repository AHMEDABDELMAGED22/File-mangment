"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signIn } from "@/actions/auth.actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 transition-all duration-200" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await signIn(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-white">Welcome back</CardTitle>
        <CardDescription className="text-zinc-400">Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Link href="/reset-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Forgot password?</Link>
            </div>
            <Input id="password" name="password" type="password" placeholder="••••••••" required className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20" />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign up</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
