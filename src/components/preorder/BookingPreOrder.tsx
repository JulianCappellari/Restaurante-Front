"use client";

import { cancelBookingPreOrder, saveBookingPreOrder, type PreOrderView } from "@/actions/preorders/preorder-actions";
import type { KitchenSignals } from "@/actions/service/service-actions";
import type { IMenu } from "@/interfaces";
import PreOrderEditor from "./PreOrderEditor";

export default function BookingPreOrder({ bookingId, initial, menu, soldOut, kitchen, defaultAlias }: {
  bookingId: number; initial: PreOrderView | null; menu: IMenu[]; soldOut: number[]; kitchen: KitchenSignals | null; defaultAlias: string;
}) {
  return (
    <PreOrderEditor initial={initial} menu={menu} soldOut={soldOut} kitchen={kitchen} defaultAlias={defaultAlias}
      onSave={(input) => saveBookingPreOrder(bookingId, input)} onCancel={() => cancelBookingPreOrder(bookingId)} />
  );
}
