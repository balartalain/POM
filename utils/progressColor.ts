export const getProgressBarColor = (percent: number) => {
  if (percent >= 70) return 'bg-emerald-500';
  if (percent >= 30) return 'bg-amber-500';
  return 'bg-red-500';
};

export const getBorderColor = (percent: number) => {
  if (percent >= 70) return 'border-l-emerald-400';
  if (percent >= 30) return 'border-l-amber-400';
  return 'border-l-red-400';
};
export const getTextColor = (percent: number) => {
  if (percent >= 70) return 'text-emerald-500';
  if (percent >= 30) return 'text-amber-500';
  return 'text-red-500';
};
export const getBgColor = (percent: number) => {
  if (percent >= 70) return 'bg-emerald-50';
  if (percent >= 30) return 'bg-amber-50';
  return 'bg-red-50';
};