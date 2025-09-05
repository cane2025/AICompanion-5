export function groupBy<T, K extends string | number | symbol>(
  arr: T[],
  getKey: (item: T) => K
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, it) => {
    const k = String(getKey(it));
    (acc[k] ??= []).push(it);
    return acc;
  }, {});
}
