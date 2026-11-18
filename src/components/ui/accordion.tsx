"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

/* Acordeón accesible (Radix, al estilo de shadcn/ui) con la paleta del cliente. */
export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className = "", ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={`border-b border-cliente-line ${className}`} {...props} />;
}

export function AccordionTrigger({ className = "", children, ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="m-0">
      <AccordionPrimitive.Trigger
        className={`group flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-lg font-semibold text-cliente-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cliente-blue ${className}`}
        {...props}
      >
        {children}
        <ChevronDown aria-hidden className="size-5 shrink-0 text-cliente-blue transition-transform duration-300 group-data-[state=open]:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className = "", children, ...props }: ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className="overflow-hidden text-cliente-muted data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none" {...props}>
      <div className={`pb-5 leading-7 ${className}`}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
