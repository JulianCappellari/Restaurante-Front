import type { ReactNode } from "react";
import AccountNav from "@/components/cuenta/AccountNav";
import "./account.css";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <><AccountNav />{children}</>;
}
