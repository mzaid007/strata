"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type SearchResult = {
  tasks: { id: string; title: string; completed: boolean; projectName: string | null }[];
  projects: { id: string; name: string }[];
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({ tasks: [], projects: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults({ tasks: [], projects: [] });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults({ tasks: [], projects: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          setResults({ tasks: [], projects: [] });
          return;
        }
        const data = (await res.json()) as SearchResult;
        setResults({ tasks: data.tasks ?? [], projects: data.projects ?? [] });
      } catch {
        setResults({ tasks: [], projects: [] });
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  if (!open) {
    return (
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search (Ctrl+K)"
      >
        Search…
        <kbd>Ctrl K</kbd>
      </button>
    );
  }

  const empty = !loading && query.trim() && results.tasks.length === 0 && results.projects.length === 0;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" className="search-backdrop" aria-label="Close search" onClick={close} />
      <div className="search-panel">
        <input
          ref={inputRef}
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks and projects…"
          aria-label="Search query"
        />
        <div className="search-results">
          {loading ? <p className="muted">Searching…</p> : null}
          {empty ? <p className="muted">No matches.</p> : null}
          {results.projects.length > 0 ? (
            <div className="search-group">
              <p className="search-group-label">Projects</p>
              {results.projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="search-hit" onClick={close}>
                  {p.name}
                </Link>
              ))}
            </div>
          ) : null}
          {results.tasks.length > 0 ? (
            <div className="search-group">
              <p className="search-group-label">Tasks</p>
              {results.tasks.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="search-hit" onClick={close}>
                  <span style={{ textDecoration: t.completed ? "line-through" : "none" }}>
                    {t.title}
                  </span>
                  {t.projectName ? <span className="muted"> · {t.projectName}</span> : null}
                </Link>
              ))}
            </div>
          ) : null}
          {!query.trim() ? <p className="muted">Type a title fragment. Esc to close.</p> : null}
        </div>
      </div>
    </div>
  );
}
