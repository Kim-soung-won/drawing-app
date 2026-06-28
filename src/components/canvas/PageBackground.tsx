import React, { useMemo } from 'react';
import { Rect, Path, Skia } from '@shopify/react-native-skia';
import { PageTemplate } from '../../types/diary';

const LINE_SPACING = 60;
const LINE_COLOR = 'rgba(139,115,85,0.15)';
const MARGIN_LINE_X = 60;
const MARGIN_LINE_COLOR = 'rgba(212,165,116,0.55)';

interface PageBackgroundProps {
  template: PageTemplate;
  color: string;
  width: number;
  height: number;
}

export default function PageBackground({ template, color, width, height }: PageBackgroundProps) {
  const { templatePath, marginPath } = useMemo(() => {
    if (width === 0 || height === 0) return { templatePath: null, marginPath: null };

    const path = Skia.Path.Make();

    if (template === 'lined') {
      for (let y = LINE_SPACING; y < height; y += LINE_SPACING) {
        path.moveTo(MARGIN_LINE_X, y);
        path.lineTo(width, y);
      }
      const mPath = Skia.Path.Make();
      mPath.moveTo(MARGIN_LINE_X, 0);
      mPath.lineTo(MARGIN_LINE_X, height);
      return { templatePath: path, marginPath: mPath };
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

    return { templatePath: path, marginPath: null };
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
      {marginPath && (
        <Path path={marginPath} color={MARGIN_LINE_COLOR} style="stroke" strokeWidth={1.5} />
      )}
    </>
  );
}
