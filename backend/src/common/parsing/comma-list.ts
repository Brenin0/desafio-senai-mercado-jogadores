/**
 * Valores aceitos separados por vírgula, sem espaços, até `maxItems`, sem repetir a chave de cada
 * valor (por padrão, o próprio valor).
 */
export function isCommaList(
  text: string,
  accepted: readonly string[],
  maxItems: number,
  keyOf: (item: string) => string = (item) => item,
): boolean {
  const items = text.split(',');
  const keys = new Set(items.map(keyOf));
  return (
    items.length <= maxItems &&
    items.every((item) => accepted.includes(item)) &&
    keys.size === items.length
  );
}

/** Campo de um critério de ordenação: `value_asc` e `value_desc` ordenam o mesmo campo, `value`. */
function sortField(criterion: string): string {
  return criterion.replace(/_(asc|desc)$/, '');
}

/** RN07: critérios de ordenação, sem repetir o campo (como em `value_asc,value_desc`). */
export function isSortList(
  text: string,
  accepted: readonly string[],
  maxCriteria: number,
): boolean {
  return isCommaList(text, accepted, maxCriteria, sortField);
}
