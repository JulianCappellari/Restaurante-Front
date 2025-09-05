'use client';
import { create } from 'zustand';

type Status = 'idle'|'checking'|'available'|'unavailable';

type ReservaSel = {
  dateTime?: string;
  people?: number;
  tableIds: number[];
  status: Status;
  set: (p: Partial<Omit<ReservaSel,'tableIds'|'status'>> & { tableIds?: number[]; status?: Status }) => void;
  setStatus: (s: Status) => void;
  toggleTable: (id:number) => void;
  clear: () => void;
};

export const useReservaSelection = create<ReservaSel>((set, get) => ({
  dateTime: undefined,
  people: undefined,
  tableIds: [],
  status: 'idle',
  set: (p) => set((s) => ({ ...s, ...p, ...(p.tableIds ? { tableIds: p.tableIds } : {}), ...(p.status ? { status: p.status } : {}) })),
  setStatus: (status) => set({ status }),
  toggleTable: (id) => {
    const { tableIds } = get();
    set({ tableIds: tableIds.includes(id) ? tableIds.filter(x=>x!==id) : [...tableIds, id] });
  },
  clear: () => set({ dateTime: undefined, people: undefined, tableIds: [], status: 'idle' }),
}));
