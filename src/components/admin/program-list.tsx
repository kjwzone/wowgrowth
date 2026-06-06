import Link from "next/link";
import { ProgramStatusSelect } from "@/components/admin/program-status-select";
import type { ProgramStatus } from "@/lib/validation/program";

export type ProgramListItem = {
  id: string;
  title: string;
  status: ProgramStatus;
  agency: string;
};

type ProgramListProps = {
  programs: ProgramListItem[];
};

export const ProgramList = ({ programs }: ProgramListProps) => (
  <ul className="mt-4 divide-y divide-slate-100">
    {programs.map((program) => (
      <li
        key={program.id}
        className="flex items-center justify-between gap-3 py-3"
      >
        <div className="min-w-0 flex-1">
          <Link href={`/programs/${program.id}`} className="hover:underline">
            {program.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500">{program.agency}</p>
        </div>
        <ProgramStatusSelect programId={program.id} value={program.status} />
      </li>
    ))}
    {programs.length === 0 ? (
      <li className="py-4 text-sm text-slate-500">등록된 공고가 없습니다.</li>
    ) : null}
  </ul>
);
