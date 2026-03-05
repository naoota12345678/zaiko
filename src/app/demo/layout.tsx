import { DemoProvider } from "@/lib/DemoContext";

export const metadata = {
  title: "GS在庫管理システム",
  description: "ガソリンスタンド向け仕入れ・在庫管理システム",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
