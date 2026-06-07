import { Link } from "react-router-dom";
import { Calendar, MapPin, Building2 } from "lucide-react";
import type { SupportProgram } from "@/types";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";

export const ProgramCard = ({ program }: { program: SupportProgram }) => (
  <Link
    to={`/programs/${program.id}`}
    className="block rounded-xl border border-outline-variant/40 bg-white p-5 shadow-sm transition hover:border-secondary/40 hover:shadow-md"
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={program.status} />
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant">
            {program.category}
          </span>
          {program.source === "bizinfo" ? (
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs text-secondary">
              기업마당
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 text-lg font-semibold text-primary">{program.title}</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            {program.agency}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {program.region}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {program.daysLeft >= 0 && program.daysLeft < 900
              ? `D-${program.daysLeft}`
              : program.deadline}
          </span>
        </div>
      </div>
      <ScoreBadge score={program.matchScore} />
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/20 pt-4 text-sm">
      <span className="font-medium text-secondary">{program.supportAmount}</span>
      <span className="text-on-surface-variant">마감 {program.deadline}</span>
    </div>
  </Link>
);
