import { PageTemplate } from '../types/diary';

export const COVER_COLORS = [
  { id: 'cream', color: '#FFFEF9', label: '크림' },
  { id: 'beige', color: '#F5E6D3', label: '베이지' },
  { id: 'rose', color: '#F5E0E8', label: '로즈' },
  { id: 'sage', color: '#E0EDE0', label: '세이지' },
  { id: 'sky', color: '#E0E8F5', label: '스카이' },
  { id: 'lavender', color: '#EBE0F5', label: '라벤더' },
] as const;

export type CoverColorId = (typeof COVER_COLORS)[number]['id'];

export interface PageTemplateOption {
  id: PageTemplate;
  label: string;
}

export const PAGE_TEMPLATES: PageTemplateOption[] = [
  { id: 'blank', label: '빈 종이' },
  { id: 'lined', label: '줄 노트' },
  { id: 'grid', label: '모눈' },
  { id: 'dotted', label: '점선' },
];
