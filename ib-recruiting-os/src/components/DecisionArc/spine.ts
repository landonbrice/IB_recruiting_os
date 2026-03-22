export function spinePoint(t: number): { x: number; y: number } {
  const padX = 60, padY = 60;
  const canvasW = 600, canvasH = 440;
  const x = padX + t * canvasW;
  const progress = 1 - Math.pow(1 - t, 2.2);
  const y = padY + canvasH * (1 - progress);
  return { x, y };
}

export function spinePath(): string {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 80; i++) pts.push(spinePoint(i / 80));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

export function midSpinePoint(t1: number, t2: number): { x: number; y: number } {
  const tMid = (t1 + t2) / 2;
  return spinePoint(tMid);
}
