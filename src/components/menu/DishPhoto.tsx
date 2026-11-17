import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";

export default function DishPhoto({ src, sizes, priority = false }: {
  src?: string | null;
  sizes: string;
  priority?: boolean;
}) {
  const local = src?.startsWith("/") && !src.startsWith("//");
  const external = src && /^https?:\/\//i.test(src);
  if (!src || (!local && !external)) {
    return (
      <div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-cliente-sage text-cliente-blue">
        <UtensilsCrossed className="size-10 opacity-70" strokeWidth={1.4} />
      </div>
    );
  }
  return <Image src={src} alt="" fill sizes={sizes} priority={priority} unoptimized={!local}
    className="object-cover" referrerPolicy={external ? "no-referrer" : undefined} />;
}
