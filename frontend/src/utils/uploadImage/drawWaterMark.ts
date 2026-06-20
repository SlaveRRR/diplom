export const drawWatermark = (
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  text = 'waterMark',
) => {
  const fontSize = Math.max(10, Math.round(width * 0.035));
  const padding = Math.max(8, Math.round(width * 0.02));

  context.save();

  context.font = `${fontSize}px sans-serif`;
  context.textAlign = 'right';
  context.textBaseline = 'bottom';

  context.lineWidth = Math.max(2, Math.round(fontSize * 0.12));
  context.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  context.fillStyle = 'rgba(255, 255, 255, 0.50)';

  context.strokeText(text, width - padding, height - padding);
  context.fillText(text, width - padding, height - padding);

  context.restore();
};
