import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">403</h1>
      <p className="mt-2 text-slate-600">접근 권한이 없습니다.</p>
      <Link href="/" className="mt-4 inline-block text-sm underline">
        홈으로
      </Link>
    </main>
  );
}
