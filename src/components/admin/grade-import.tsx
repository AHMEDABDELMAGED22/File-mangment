"use client";

import { useState, useCallback } from "react";
import { importGradesCsvAction } from "@/actions/grade.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";

interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export function GradeCsvImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const response = await importGradesCsvAction(text);

      if (response.error) {
        setError(response.error);
      } else if (response.result) {
        setResult(response.result);
      }
    } catch {
      setError("An unexpected error occurred during import");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="text-base text-zinc-200 flex items-center gap-2">
          <Upload className="h-4 w-4 text-amber-400" />
          Import Grades CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-amber-500 bg-amber-500/5"
              : file
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/30"
          }`}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".csv";
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFile(f);
            };
            input.click();
          }}
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-emerald-400" />
              <p className="text-sm text-emerald-300 font-medium">{file.name}</p>
              <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setResult(null);
                  setError(null);
                }}
                className="mt-1 text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-zinc-500" />
              <p className="text-sm text-zinc-400">
                Drop your CSV file here or <span className="text-amber-400">click to browse</span>
              </p>
              <p className="text-xs text-zinc-600">Supports UTF-8 encoded CSV files</p>
            </div>
          )}
        </div>

        {/* Import button */}
        <Button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Grades
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Import Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-zinc-800/50">
                  <p className="text-lg font-bold text-white">{result.totalRows}</p>
                  <p className="text-xs text-zinc-500">Total Rows</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-zinc-800/50">
                  <p className="text-lg font-bold text-emerald-400">{result.imported}</p>
                  <p className="text-xs text-zinc-500">Imported</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-zinc-800/50">
                  <p className="text-lg font-bold text-amber-400">{result.skipped}</p>
                  <p className="text-xs text-zinc-500">Skipped</p>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-amber-300 mb-2">Import Warnings:</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-400/70 mb-1">• {err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
