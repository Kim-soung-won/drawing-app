import { create } from 'zustand';
import { DiaryEntry, DrawingData } from '../types/diary';
import { DiaryRepository } from '../repositories/DiaryRepository';

interface DiaryState {
  entries: DiaryEntry[];
  isLoading: boolean;

  init: () => Promise<void>;
  loadEntries: () => Promise<void>;
  saveEntry: (entry: DiaryEntry, drawingData: DrawingData) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  loadDrawing: (drawingPath: string) => DrawingData | null;
}

export const useDiaryStore = create<DiaryState>((set) => ({
  entries: [],
  isLoading: true,

  init: async () => {
    await DiaryRepository.init();
    const entries = await DiaryRepository.getAll();
    set({ entries, isLoading: false });
  },

  loadEntries: async () => {
    const entries = await DiaryRepository.getAll();
    set({ entries });
  },

  saveEntry: async (entry, drawingData) => {
    await DiaryRepository.save(entry, drawingData);
    const entries = await DiaryRepository.getAll();
    set({ entries });
  },

  deleteEntry: async (id) => {
    await DiaryRepository.delete(id);
    const entries = await DiaryRepository.getAll();
    set({ entries });
  },

  loadDrawing: (drawingPath) => {
    return DiaryRepository.loadDrawing(drawingPath);
  },
}));
