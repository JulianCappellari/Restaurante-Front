"use client";
import React, { useState } from "react";
import {  motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";


type Card = {
  id: number;
  content: JSX.Element | React.ReactNode | string;
  className: string;
  thumbnail: string;
};

export const LayoutGrid = ({ cards }: { cards: Card[] }) => {
  return (
    <div className="w-full h-full p-10 grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto gap-4">
      {cards.map((card, i) => (
        <div key={i} className={cn(card.className, "relative overflow-hidden")}>
          <Image
            src={card.thumbnail}
            height="500"
            width="500"
            className="object-cover object-top absolute inset-0 h-full w-full rounded-lg shadow-lg shadow-primario-200"
            alt="thumbnail"
          />
        </div>
      ))}
    </div>
  );
};
