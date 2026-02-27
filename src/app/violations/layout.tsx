import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

export default function ViolationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
