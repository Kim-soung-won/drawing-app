export const CANVAS = {
  defaultWidth: 1080,
  defaultHeight: 1920,
  backgroundColor: '#FFFEF9',

  pen: {
    minWidth: 1,
    defaultWidth: 2.5,
    maxWidth: 6,
    widths: [1.5, 2.5, 4.5] as const,
  },

  eraser: {
    defaultWidth: 20,
    widths: [10, 20, 40] as const,
  },

  drawing: {
    version: 1,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  },
} as const;
