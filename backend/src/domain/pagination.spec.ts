import { paginate } from './pagination';

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

describe('RN07 – paginação depois de buscar, filtrar e ordenar (tabela de exemplos)', () => {
  it.each<[number, number, number, number[], number, number]>([
    [23, 10, 1, range(1, 10), 23, 3],
    [23, 10, 3, range(21, 23), 23, 3],
    [23, 10, 4, [], 23, 3],
    [23, 50, 1, range(1, 23), 23, 1],
    [0, 10, 1, [], 0, 0],
  ])(
    '%i itens, limit %i, page %i',
    (total, limit, page, data, totalItems, totalPages) => {
      const result = paginate(range(1, total), page, limit);
      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({ page, limit, totalItems, totalPages });
    },
  );
});
