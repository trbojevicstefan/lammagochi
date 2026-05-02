import { useCanvasPet, type FPSMode } from '../engine';

type Props = {
  level: number;
  emotion: string;
  skin?: string;
  night?: boolean;
  actionAnimation?: string | null;
  interactionSpark?: number;
  mode?: FPSMode;
};

export const CanvasPet = ({ level, emotion, skin = 'none', night = false, actionAnimation, interactionSpark = 0, mode = 'full' }: Props) => {
  const { canvasRef } = useCanvasPet({ level, emotion, skin, night, actionAnimation, interactionSpark, mode });

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        imageRendering: 'pixelated',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
    />
  );
};
