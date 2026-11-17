import "./staff.css";
import { TopMenu } from "@/components/dashboard/TopMenu";
import CustomerScope from "@/components/dashboard/CustomerScope";
import MotionProvider from "@/components/motion/MotionProvider";


export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerScope>
      <TopMenu />
      <MotionProvider />
      <main id="contenido-principal" tabIndex={-1} className="min-h-[calc(100dvh-4rem)] scroll-mt-24">{children}</main>
    </CustomerScope>
  );
}
