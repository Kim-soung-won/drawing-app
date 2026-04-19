import { create } from 'zustand';
import { Page, PageTemplate, Stroke } from '../types/diary';
import { PEN_COLORS } from '../constants/colors';
import { CANVAS } from '../constants/canvas';

let pageCounter = 0;

function newPage(template: PageTemplate): Page {
  return {
    id: `page-${Date.now()}-${++pageCounter}`,
    template,
    strokes: [],
    redoStack: [],
  };
}

interface CanvasState {
  pages: Page[];
  currentPageIndex: number;
  coverColor: string;

  tool: 'pen' | 'eraser';
  penColor: string;
  penWidth: number;
  eraserWidth: number;

  addStroke: (stroke: Stroke) => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  addPage: (template: PageTemplate) => void;
  setCurrentPageIndex: (index: number) => void;
  initNew: (coverColor: string, template: PageTemplate) => void;
  loadFromDrawingData: (data: any) => void;
  reset: () => void;

  setTool: (tool: 'pen' | 'eraser') => void;
  toggleTool: () => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setEraserWidth: (width: number) => void;
}

const DEFAULT_COVER = '#FFFEF9';
const DEFAULT_TEMPLATE: PageTemplate = 'blank';

export const useCanvasStore = create<CanvasState>((set) => ({
  pages: [newPage(DEFAULT_TEMPLATE)],
  currentPageIndex: 0,
  coverColor: DEFAULT_COVER,

  tool: 'pen',
  penColor: PEN_COLORS[0],
  penWidth: CANVAS.pen.defaultWidth,
  eraserWidth: CANVAS.eraser.defaultWidth,

  addStroke: (stroke) =>
    set((state) => {
      const pages = [...state.pages];
      const page = { ...pages[state.currentPageIndex] };
      page.strokes = [...page.strokes, stroke];
      page.redoStack = [];
      pages[state.currentPageIndex] = page;
      return { pages };
    }),

  undo: () =>
    set((state) => {
      const pages = [...state.pages];
      const page = { ...pages[state.currentPageIndex] };
      if (page.strokes.length === 0) return state;
      const last = page.strokes[page.strokes.length - 1];
      page.strokes = page.strokes.slice(0, -1);
      page.redoStack = [...page.redoStack, last];
      pages[state.currentPageIndex] = page;
      return { pages };
    }),

  redo: () =>
    set((state) => {
      const pages = [...state.pages];
      const page = { ...pages[state.currentPageIndex] };
      if (page.redoStack.length === 0) return state;
      const next = page.redoStack[page.redoStack.length - 1];
      page.redoStack = page.redoStack.slice(0, -1);
      page.strokes = [...page.strokes, next];
      pages[state.currentPageIndex] = page;
      return { pages };
    }),

  clearAll: () =>
    set((state) => {
      const pages = [...state.pages];
      const page = { ...pages[state.currentPageIndex] };
      page.redoStack = [...page.strokes, ...page.redoStack];
      page.strokes = [];
      pages[state.currentPageIndex] = page;
      return { pages };
    }),

  addPage: (template) =>
    set((state) => {
      const pages = [...state.pages, newPage(template)];
      return { pages, currentPageIndex: pages.length - 1 };
    }),

  setCurrentPageIndex: (index) =>
    set({ currentPageIndex: index }),

  initNew: (coverColor, template) =>
    set({
      pages: [newPage(template)],
      currentPageIndex: 0,
      coverColor,
    }),

  loadFromDrawingData: (data: any) => {
    let pages: Page[];
    if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
      pages = data.pages.map((p: any) => ({
        id: p.id ?? `page-${Date.now()}-${++pageCounter}`,
        template: (p.template ?? 'blank') as PageTemplate,
        strokes: p.strokes ?? [],
        redoStack: [],
      }));
    } else {
      // 레거시 포맷: strokes 배열이 최상위에 있던 구조
      pages = [
        {
          id: 'page-legacy',
          template: 'blank' as PageTemplate,
          strokes: data.strokes ?? [],
          redoStack: [],
        },
      ];
    }
    set({
      pages,
      currentPageIndex: 0,
      coverColor: data.coverColor ?? DEFAULT_COVER,
    });
  },

  reset: () =>
    set({
      pages: [newPage(DEFAULT_TEMPLATE)],
      currentPageIndex: 0,
      coverColor: DEFAULT_COVER,
    }),

  setTool: (tool) => set({ tool }),
  toggleTool: () =>
    set((state) => ({ tool: state.tool === 'pen' ? 'eraser' : 'pen' })),
  setPenColor: (color) => set({ penColor: color }),
  setPenWidth: (width) => set({ penWidth: width }),
  setEraserWidth: (width) => set({ eraserWidth: width }),
}));
