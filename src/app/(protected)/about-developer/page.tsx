"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Sparkles,
  Globe,
  User,
  GraduationCap
} from "lucide-react";

// Brand icons
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );
}

const DEVELOPER = {
  name: "Ahmed Mohamed Ahmed",
  initials: "AM",
  title: "Software Engineer",
  bio: "I am a results-driven developer focused on building scalable, responsive, and user-centered web experiences using modern technologies. I have hands-on experience through the Digital Egypt Pioneers Initiative, freelance React projects, competitive programming at ICPC Minya University, and real-world project work. I also work on backend development using Supabase and Node.js to build full-stack solutions.",
  location: "Minia, Egypt",
  email: "ahmedmohummed22@gmail.com",
  phone: "+201025893610",
  linkedin: "https://www.linkedin.com/in/ahmed-mohamed-039278231/",
  github: "https://github.com/AHMEDABDELMAGED22",
  project: {
    name: "Learning Mentor Platform",
    demo: "https://learning-pentor-platform.vercel.app/",
    repo: "https://github.com/AHMEDABDELMAGED22/learning-pentor-platform",
  },
  highlights: [
    "Digital Egypt Pioneers Initiative (DEPI)",
    "ICPC Minya University — Competitive Programming",
    "React, JavaScript, HTML5, CSS3, REST APIs",
    "Backend: Supabase & Node.js",
    "Bilingual & user-friendly interfaces",
    "Clean architecture & reusable components",
  ],
};

export default function AboutDeveloperPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(DEVELOPER.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = DEVELOPER.email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-8 sm:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
          <div className="relative shrink-0">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 opacity-60 blur-md" />
            <Avatar className="relative h-32 w-32 md:h-40 md:w-40 border-2 border-zinc-700 ring-4 ring-violet-500/20">
              <AvatarImage src="/developer-avatar.jpeg" alt={DEVELOPER.name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-4xl md:text-5xl font-bold">
                {DEVELOPER.initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {DEVELOPER.name}
              </h1>
              <h2 className="text-sm md:text-base text-violet-400 font-medium tracking-wide uppercase mt-2">
                {DEVELOPER.title}
              </h2>
            </div>
            <p className="text-base md:text-lg text-zinc-400 leading-relaxed">
              {DEVELOPER.bio}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <a href={`mailto:${DEVELOPER.email}`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium shadow-lg shadow-violet-500/20 transition-all">
                <Mail className="h-4 w-4" />
                Contact Me
              </a>
              <a href={DEVELOPER.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-all">
                <LinkedinIcon className="h-4 w-4" />
                Connect
              </a>
              <a href={DEVELOPER.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-all">
                <GithubIcon className="h-4 w-4" />
                Follow
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Contact & Social */}
        <div className="space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <User className="h-4 w-4 text-violet-400" />
              Contact Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 uppercase font-medium">Email</p>
                  <a href={`mailto:${DEVELOPER.email}`} className="text-sm text-zinc-300 hover:text-white transition-colors truncate block">
                    {DEVELOPER.email}
                  </a>
                </div>
                <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-violet-400 shrink-0" onClick={handleCopyEmail}>
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 uppercase font-medium">Phone</p>
                  <a href={`tel:${DEVELOPER.phone}`} className="text-sm text-zinc-300 hover:text-white transition-colors truncate block">
                    {DEVELOPER.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 uppercase font-medium">Location</p>
                  <span className="text-sm text-zinc-300 truncate block">{DEVELOPER.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Globe className="h-4 w-4 text-violet-400" />
              Social Profiles
            </h3>
            <div className="flex flex-col gap-2">
              <a href={DEVELOPER.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all group">
                <LinkedinIcon className="h-5 w-5 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">LinkedIn Profile</span>
                <ExternalLink className="h-4 w-4 text-zinc-600 ml-auto group-hover:text-violet-400" />
              </a>
              <a href={DEVELOPER.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all group">
                <GithubIcon className="h-5 w-5 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">GitHub Profile</span>
                <ExternalLink className="h-4 w-4 text-zinc-600 ml-auto group-hover:text-violet-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Project & Highlights */}
        <div className="md:col-span-2 space-y-6">
          {/* Featured Project */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-violet-400" />
                Featured Project
              </h3>
              <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20">
                Showcase
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border border-violet-500/10 rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-8 w-8 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white">{DEVELOPER.project.name}</h4>
                  <p className="text-sm text-zinc-400 mt-1">A comprehensive full-stack web application demonstrating modern development practices, clean architecture, and responsive design.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={DEVELOPER.project.demo} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium shadow-lg shadow-violet-500/20 transition-all">
                  <ExternalLink className="h-4 w-4" />
                  View Live Demo
                </a>
                <a href={DEVELOPER.project.repo} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-sm font-medium transition-all">
                  <GithubIcon className="h-4 w-4" />
                  Source Code
                </a>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-violet-400" />
              Skills & Experience
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEVELOPER.highlights.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                  <p className="text-sm text-zinc-300 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
          


        </div>
      </div>
    </div>
  );
}
