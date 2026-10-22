/** Campo de um critério de ordenação: `value_asc` e `value_desc` ordenam o mesmo campo, `value`. */
function sortField(criterion: string): string {
  return criterion.replace(/_(asc|desc)$/, '');
}

/**
 * Critérios de ordenação separados por vírgula, sem espaços: até `maxCriteria` valores aceitos, sem
 * repetir o campo (como em `value_asc,value_desc`).
 */
export function isSortList(
  text: string,
  accepted: readonly string[],
  maxCriteria: number,
): boolean {
  const criteria = text.split(',');
  const fields = new Set(criteria.map(sortField));
  return (
    criteria.length <= maxCriteria &&
    criteria.every((criterion) => accepted.includes(criterion)) &&
    fields.size === criteria.length
  );
}
