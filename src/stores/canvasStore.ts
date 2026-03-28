import { create } from 'zustand';
import { Stroke } from '../types/diary';
import { PEN_COLORS } from '../constants/colors';
import { CANVAS } from '../constants/canvas';

interface CanvasState {
  strokes: Stroke[];
  redoStack: Stroke[];

  tool: 'pen' | 'eraser';
  penColor: string;
  penWidth: number;
  eraserWidth: number;
  addStroke: (stroke: Stroke) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  clearAll: () => void;
  loadStrokes: (strokes: Stroke[]) => void;

  setTool: (tool: 'pen' | 'eraser') => void;
  toggleTool: () => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setEraserWidth: (width: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  strokes: [],
  redoStack: [],

  tool: 'pen',
  penColor: PEN_COLORS[0],
  penWidth: CANVAS.pen.defaultWidth,
  eraserWidth: CANVAS.eraser.defaultWidth,

  addStroke: (stroke) =>
    set((state) => ({
      strokes: [...state.strokes, stroke],
      redoStack: [],
    })),

  undo: () =>
    set((state) => {
      if (state.strokes.length === 0) return state;
      const last = state.strokes[state.strokes.length - 1];
      return {
        strokes: state.strokes.slice(0, -1),
        redoStack: [...state.redoStack, last],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        strokes: [...state.strokes, next],
        redoStack: state.redoStack.slice(0, -1),
      };
    }),

  clear: () => set({ strokes: [], redoStack: [] }),

  clearAll: () =>
    set((state) => ({
      strokes: [],
      redoStack: [...state.strokes, ...state.redoStack],
    })),

  loadStrokes: (strokes) => set({ strokes, redoStack: [] }),

  setTool: (tool) => set({ tool }),
  toggleTool: () =>
    set((state) => ({ tool: state.tool === 'pen' ? 'eraser' : 'pen' })),
  setPenColor: (color) => set({ penColor: color }),
  setPenWidth: (width) => set({ penWidth: width }),
  setEraserWidth: (width) => set({ eraserWidth: width }),
}));
