import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
