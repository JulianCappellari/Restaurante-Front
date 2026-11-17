import Image from "next/image";
import type { ReactNode } from "react";

export default function CustomerIntro({ title, description, children, image, imageAlt = "" }: {
  title: string;
  description?: string;
  children?: ReactNode;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <header data-customer-inverse className="relative overflow-hidden bg-cliente-blue text-white">
      <div className={`customer-shell grid gap-8 py-10 sm:py-14 ${image ? "md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]" : ""}`}>
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 data-split className="text-balance text-5xl leading-[0.95] sm:text-7xl">{title}</h1>
            {description && <p data-reveal="up" className="mt-4 max-w-[52ch] text-base leading-7 text-blue-100">{description}</p>}
          </div>
          {children}
        </div>
        {image && (
          <figure data-reveal="clip" className="relative hidden h-52 overflow-hidden rounded-2xl md:block lg:h-64">
            <div data-zoom className="absolute inset-0">
              <Image src={image} alt={imageAlt} fill priority sizes="(min-width: 1024px) 448px, 384px" className="object-cover" />
            </div>
          </figure>
        )}
      </div>
    </header>
  );
}
