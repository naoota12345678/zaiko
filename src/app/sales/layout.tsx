import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

export default function SectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
