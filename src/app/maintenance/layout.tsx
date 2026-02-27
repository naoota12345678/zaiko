import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
