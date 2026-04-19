import React, { useMemo } from 'react';
import { Rect, Path, Skia } from '@shopify/react-native-skia';
import { PageTemplate } from '../../types/diary';

const LINE_SPACING = 60;
const LINE_COLOR = 'rgba(0,0,0,0.07)';
const MARGIN = 40;

interface PageBackgroundProps {
  template: PageTemplate;
  color: string;
  width: number;
  height: number;
}

export default function PageBackground({ template, color, width, height }: PageBackgroundProps) {
  const templatePath = useMemo(() => {
    if (width === 0 || height === 0) return null;

    const path = Skia.Path.Make();

    if (template === 'lined') {
      for (let y = LINE_SPACING; y < height; y += LINE_SPACING) {
        path.moveTo(MARGIN, y);
        path.lineTo(width - MARGIN, y);
      }
    } else if (template === 'grid') {
      for (let y = LINE_SPACING; y < height; y += LINE_SPACING) {
        path.moveTo(0, y);
        path.lineTo(width, y);
      }
      for (let x = LINE_SPACING; x < width; x += LINE_SPACING) {
        path.moveTo(x, 0);
        path.lineTo(x, height);
      }
    } else if (template === 'dotted') {
      for (let y = LINE_SPACING; y < height; y += LINE_SPACING) {
        for (let x = LINE_SPACING; x < width; x += LINE_SPACING) {
          path.addCircle(x, y, 3.5);
        }
      }
    }

    return path;
  }, [template, width, height]);

  return (
    <>
      <Rect x={0} y={0} width={width} height={height} color={color} />
      {templatePath && (
        <Path
          path={templatePath}
          color={LINE_COLOR}
          style={template === 'dotted' ? 'fill' : 'stroke'}
          strokeWidth={1.5}
        />
      )}
    </>
  );
}
