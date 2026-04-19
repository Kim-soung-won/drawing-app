export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export type PageTemplate = 'blank' | 'lined' | 'grid' | 'dotted';

export interface Page {
  id: string;
  template: PageTemplate;
  strokes: Stroke[];
  redoStack: Stroke[];
}

export interface DrawingData {
  version: number;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  coverColor: string;
  pages: Page[];
}

export interface DiaryEntry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  drawingPath: string;
  thumbnailPath: string | null;
}
