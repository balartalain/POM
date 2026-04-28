const DEFAULT_OPTS: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };

export const formatDate = (
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = DEFAULT_OPTS,
): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', options);
};
