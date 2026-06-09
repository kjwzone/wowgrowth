import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { isAppDataBootstrapped, syncAppDataOnLogin } from "@/lib/api";
import { useSession } from "@/lib/use-session";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils";

export const AppLayout = () => {
  const { isLoggedIn } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn && !isAppDataBootstrapped()) {
      void syncAppDataOnLogin();
    }
  }, [isLoggedIn]);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[var(--spacing-sidebar)] transform bg-white transition lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onNavigate={closeMobile} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
