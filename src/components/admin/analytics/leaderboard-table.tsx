"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Search, ArrowUpDown, Medal, Trophy } from "lucide-react";
import type { StudentRanking } from "@/lib/types";

interface LeaderboardTableProps {
  rankings: StudentRanking[];
}

type SortKey = "totalScore" | "averageScore" | "studentName";
type SortDir = "asc" | "desc";

export function LeaderboardTable({ rankings }: LeaderboardTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "studentName" ? "asc" : "desc");
    }
  };

  const filtered = useMemo(() => {
    let result = rankings;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.studentCode.toLowerCase().includes(q)
      );
    }
    // Re-sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "studentName") {
        cmp = a.studentName.localeCompare(b.studentName);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [rankings, search, sortKey, sortDir]);

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1.5">
          <Crown className="h-4 w-4 text-amber-400" />
          <span className="font-bold text-amber-400">1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1.5">
          <Medal className="h-4 w-4 text-zinc-300" />
          <span className="font-bold text-zinc-300">2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1.5">
          <Medal className="h-4 w-4 text-amber-600" />
          <span className="font-bold text-amber-600">3</span>
        </div>
      );
    }
    return <span className="text-zinc-500 font-mono text-sm">{rank}</span>;
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg text-zinc-200 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            Student Leaderboard
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 h-9 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 w-16">Rank</TableHead>
                <TableHead
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors select-none"
                  onClick={() => toggleSort("studentName")}
                >
                  <span className="flex items-center gap-1">
                    Student Name
                    <ArrowUpDown className="h-3 w-3" />
                    {sortIndicator("studentName")}
                  </span>
                </TableHead>
                <TableHead className="text-zinc-400 hidden sm:table-cell">Subjects</TableHead>
                <TableHead
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors select-none text-right"
                  onClick={() => toggleSort("totalScore")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Total Score
                    <ArrowUpDown className="h-3 w-3" />
                    {sortIndicator("totalScore")}
                  </span>
                </TableHead>
                <TableHead
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors select-none text-right"
                  onClick={() => toggleSort("averageScore")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Average
                    <ArrowUpDown className="h-3 w-3" />
                    {sortIndicator("averageScore")}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                    {search ? "No students match your search." : "No ranking data available."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow
                    key={r.studentCode}
                    className={`border-zinc-800 transition-colors ${
                      r.rank === 1
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : r.rank <= 3
                        ? "bg-zinc-800/20 hover:bg-zinc-800/40"
                        : "hover:bg-zinc-800/30"
                    }`}
                  >
                    <TableCell className="font-medium">{getRankBadge(r.rank)}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${r.rank === 1 ? "text-amber-300" : "text-zinc-200"}`} dir="auto">
                          {r.studentName}
                        </p>
                        <p className="text-xs text-zinc-600 font-mono">{r.studentCode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm hidden sm:table-cell">{r.subjectCount}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${r.rank === 1 ? "text-amber-400" : "text-zinc-200"}`}>
                      {r.totalScore}
                    </TableCell>
                    <TableCell className="text-right text-zinc-400 tabular-nums text-sm">
                      {r.averageScore}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-600">
              Showing {filtered.length} of {rankings.length} students
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
