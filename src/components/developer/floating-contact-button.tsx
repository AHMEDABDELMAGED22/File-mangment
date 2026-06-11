"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Mail, X } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function FloatingContactButton() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50" ref={menuRef}>
      {/* Contact Popup Menu */}
      <div 
        className={`absolute bottom-full right-0 mb-4 w-64 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="p-4 border-b border-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">Quick Contact</h3>
          <p className="text-xs text-zinc-400 mt-1">Get in touch directly</p>
        </div>
        
        <div className="p-2 flex flex-col gap-1">
          <a 
            href="https://wa.me/201025893610" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <WhatsAppIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">WhatsApp</span>
              <span className="text-[10px] text-emerald-500/70 uppercase font-semibold">Primary</span>
            </div>
          </a>

          <a 
            href="mailto:ahmedmohummed22@gmail.com"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="h-4 w-4 text-zinc-300" />
            </div>
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Email</span>
          </a>

          <a 
            href="https://www.linkedin.com/in/ahmed-mohamed-039278231/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <LinkedinIcon className="h-4 w-4 text-zinc-300" />
            </div>
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">LinkedIn</span>
          </a>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              id="floating-contact-btn"
              aria-label="Quick Contact"
              className="relative group outline-none"
              onClick={() => setOpen(!open)}
            />
          }
        >
          {/* Pulse ring (only show when closed) */}
          {!open && (
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-[contact-pulse_3s_ease-in-out_infinite] pointer-events-none" />
          )}

          {/* Button face */}
          <span className="relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/25 transition-all duration-300 hover:scale-110 hover:shadow-violet-500/40 focus-visible:ring-4 focus-visible:ring-violet-400/50 active:scale-95">
            <span className={`absolute transition-all duration-300 ${open ? 'opacity-0 scale-50 -rotate-90' : 'opacity-100 scale-100 rotate-0'}`}>
              <MessageCircle className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-12" />
            </span>
            <span className={`absolute transition-all duration-300 ${open ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}>
              <X className="h-6 w-6 text-white" />
            </span>
          </span>
        </TooltipTrigger>
        {!open && (
          <TooltipContent side="left" sideOffset={12}>
            Quick Contact
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
