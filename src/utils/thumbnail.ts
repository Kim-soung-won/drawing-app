import {
  Skia,
  ImageFormat,
  PaintStyle,
  StrokeCap,
  StrokeJoin,
} from '@shopify/react-native-skia';
import { DrawingData, Point } from '../types/diary';
import { COLORS } from '../constants/colors';

const THUMB_W = 240;

function buildPath(points: Point[]) {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;

  path.moveTo(points[0].x, points[0].y);

  if (points.length < 3) {
    if (points.length === 2) path.lineTo(points[1].x, points[1].y);
    return path;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    path.quadTo(points[i].x, points[i].y, midX, midY);
  }

  const last = points[points.length - 1];
  path.lineTo(last.x, last.y);
  return path;
}

export function generateThumbnail(drawingData: DrawingData): string | null {
  try {
    const canvasW = drawingData.canvas.width;
    const canvasH = drawingData.canvas.height;
    if (!canvasW || !canvasH) return null;

    const thumbH = Math.round(THUMB_W * (canvasH / canvasW));
    const surface = Skia.Surface.Make(THUMB_W, thumbH);
    if (!surface) return null;

    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color(drawingData.coverColor ?? COLORS.canvas));
    canvas.scale(THUMB_W / canvasW, thumbH / canvasH);

    const firstPage =
      drawingData.pages && drawingData.pages.length > 0
        ? drawingData.pages[0]
        : { strokes: (drawingData as any).strokes ?? [] };

    for (const stroke of firstPage.strokes) {
      if (stroke.points.length === 0) continue;

      const paint = Skia.Paint();
      paint.setColor(Skia.Color(stroke.color));
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(stroke.width);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setAntiAlias(true);

      canvas.drawPath(buildPath(stroke.points), paint);
    }

    const image = surface.makeImageSnapshot();
    return image.encodeToBase64(ImageFormat.PNG, 90);
  } catch {
    return null;
  }
}
