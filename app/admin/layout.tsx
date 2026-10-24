import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/server/admin-guard";

export const dynamic = "force-dynamic";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!requireAdmin()) redirect("/admin/login");
  return children;
}
