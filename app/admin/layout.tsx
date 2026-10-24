import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/server/admin-guard";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!await requireAdmin()) redirect("/admin/login");
  return children;
}
