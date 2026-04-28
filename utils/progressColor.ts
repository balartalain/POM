export const getProgressLevel = (percent: number) => {
  if (percent >= 70) return { level: 'Alta completitud', color: 'emerald' };
  if (percent >= 30) return { level: 'En progreso', color: 'blue' };
  return { level: 'Baja completitud', color: 'red' };
};

export const getProgressBarColor = (percent: number) => {
  if (percent >= 70) return 'bg-emerald-500';
  if (percent >= 30) return 'bg-blue-500';
  return 'bg-red-500';
};

export const getBorderColor = (percent: number) => {
  if (percent >= 70) return 'border-l-emerald-400';
  if (percent >= 30) return 'border-l-amber-400';
  return 'border-l-red-400';
};

export const getBadgeStyles = (color: string) => {
  if (color === 'emerald') return 'bg-emerald-50 text-emerald-600';
  if (color === 'blue') return 'bg-blue-50 text-blue-600';
  return 'bg-red-50 text-red-500';
};
