import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgramCard } from "@/components/ui/ProgramCard";
import { programApi } from "@/lib/api";
import { programCategories } from "@/data/programs";
import type { SupportProgram } from "@/types";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<SupportProgram[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");

  useEffect(() => {
    void programApi.list().then(setPrograms);
  }, []);

  const filtered = useMemo(
    () =>
      programs.filter((p) => {
        const matchQuery =
          !query ||
          p.title.includes(query) ||
          p.agency.includes(query) ||
          p.category.includes(query);
        const matchCategory = category === "전체" || p.category === category;
        return matchQuery && matchCategory;
      }),
    [programs, query, category],
  );

  return (
    <div>
      <PageHeader
        title="정부지원사업 공고 목록"
        description="공고 목록 → '기업마당' API 실시간 연동 예정"
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="공고명·기관·카테고리 검색"
            className="w-full rounded-xl border border-outline-variant/50 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-secondary focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {programCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === cat
                ? "bg-primary text-on-primary"
                : "bg-white text-on-surface-variant ring-1 ring-outline-variant/50 hover:bg-surface-container"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-on-surface-variant">검색 결과가 없습니다.</p>
        ) : null}
      </div>
    </div>
  );
}
