export interface Pan {
  x: number;
  y: number;
}

export interface ViewportParams {
  contentWidth: number;
  contentHeight: number;
  stageWidth: number;
  stageHeight: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export function clampPan(next: Pan, p: ViewportParams): Pan {
  const centerOffsetX = (p.stageWidth * (1 - p.zoom)) / 2;
  const centerOffsetY = (p.stageHeight * (1 - p.zoom)) / 2;
  let px = next.x;
  let py = next.y;

  if (p.contentWidth * p.zoom <= p.stageWidth) {
    px = 0;
  } else {
    const maxPx = p.stageWidth - centerOffsetX - p.offsetX * p.zoom;
    const minPx = -centerOffsetX - (p.offsetX + p.contentWidth) * p.zoom;
    px = Math.min(Math.max(next.x, Math.min(minPx, maxPx)), Math.max(minPx, maxPx));
  }

  if (p.contentHeight * p.zoom <= p.stageHeight) {
    py = 0;
  } else {
    const maxPy = p.stageHeight - centerOffsetY - p.offsetY * p.zoom;
    const minPy = -centerOffsetY - (p.offsetY + p.contentHeight) * p.zoom;
    py = Math.min(Math.max(next.y, Math.min(minPy, maxPy)), Math.max(minPy, maxPy));
  }

  return { x: px, y: py };
}

export function clampPanSoft(next: Pan, p: ViewportParams): Pan {
  const centerOffsetX = (p.stageWidth * (1 - p.zoom)) / 2;
  const centerOffsetY = (p.stageHeight * (1 - p.zoom)) / 2;
  const maxPx = p.stageWidth - centerOffsetX - p.offsetX * p.zoom;
  const minPx = -centerOffsetX - (p.offsetX + p.contentWidth) * p.zoom;
  const maxPy = p.stageHeight - centerOffsetY - p.offsetY * p.zoom;
  const minPy = -centerOffsetY - (p.offsetY + p.contentHeight) * p.zoom;
  return {
    x: Math.min(Math.max(next.x, Math.min(minPx, maxPx)), Math.max(minPx, maxPx)),
    y: Math.min(Math.max(next.y, Math.min(minPy, maxPy)), Math.max(minPy, maxPy)),
  };
}

export function panForPointerZoom(
  pointer: Pan,
  pan: Pan,
  zoom: number,
  newZoom: number,
  stageWidth: number,
  stageHeight: number,
): Pan {
  const centerOffsetX = (stageWidth * (1 - zoom)) / 2;
  const centerOffsetY = (stageHeight * (1 - zoom)) / 2;
  const centerOffsetX2 = (stageWidth * (1 - newZoom)) / 2;
  const centerOffsetY2 = (stageHeight * (1 - newZoom)) / 2;

  const localX = (pointer.x - centerOffsetX - pan.x) / zoom;
  const localY = (pointer.y - centerOffsetY - pan.y) / zoom;

  return {
    x: pointer.x - centerOffsetX2 - localX * newZoom,
    y: pointer.y - centerOffsetY2 - localY * newZoom,
  };
}
