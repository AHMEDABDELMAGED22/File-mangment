import { Shield } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-800 shadow-lg">
            <img src="/logo.png" alt="AntiDrive Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            AntiDrive
          </h1>
        </div>
        {children}
      </div>
      <footer className="fixed bottom-0 right-0 left-0 h-10 bg-zinc-950/20 backdrop-blur-sm border-t border-zinc-900/50 flex items-center justify-center z-10">
        <p className="text-zinc-500 text-[10px] sm:text-xs font-medium tracking-wider uppercase">
          Made by <a href="https://www.linkedin.com/in/ahmed-mohamed-039278231/" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 hover:underline transition-colors">Ahmed AbdElmaged</a>
        </p>
      </footer>
    </div>
  );
}
