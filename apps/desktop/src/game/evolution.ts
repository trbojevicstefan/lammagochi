export type EvolutionStage = 'baby' | 'child' | 'teen' | 'adult';

export const getEvolutionStage = (level: number): EvolutionStage => {
  if (level <= 2) return 'baby';
  if (level <= 5) return 'child';
  if (level <= 8) return 'teen';
  return 'adult';
};

export const getEvolutionName = (stage: EvolutionStage): string => {
  switch (stage) {
    case 'baby': return 'Hatchling';
    case 'child': return 'Sprout';
    case 'teen': return 'Wanderer';
    case 'adult': return 'Sage';
  }
};

export const getEvolutionColor = (stage: EvolutionStage): string => {
  switch (stage) {
    case 'baby': return '#fef3c7';
    case 'child': return '#5eead4';
    case 'teen': return '#22d3ee';
    case 'adult': return '#c084fc';
  }
};

export const getNextEvolutionLevel = (level: number): number | null => {
  if (level < 3) return 3;
  if (level < 6) return 6;
  if (level < 9) return 9;
  return null;
};
