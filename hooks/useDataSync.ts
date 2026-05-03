import { useEffect, useRef } from 'react';

export type DataUpdateType = 'UPDATE_PLANS' | 'UPDATE_ACTIVITIES' | 'UPDATE_COMPLETIONS';

/**
 * Llama a `callback` cada vez que llega un evento pame:data-update
 * con alguno de los tipos indicados.
 *
 * Uso: useDataSync('UPDATE_PLANS', fetchPlans)
 *      useDataSync(['UPDATE_PLANS', 'UPDATE_ACTIVITIES'], reload)
 */
export function useDataSync(
  types: DataUpdateType | DataUpdateType[],
  callback: () => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const watched = Array.isArray(types) ? types : [types];

    const handler = (event: Event) => {
      const { type } = (event as CustomEvent<{ type: DataUpdateType }>).detail;
      if (watched.includes(type)) callbackRef.current();
    };

    window.addEventListener('pame:data-update', handler);
    return () => window.removeEventListener('pame:data-update', handler);
  }, [types]);
}
