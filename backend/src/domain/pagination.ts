export interface PageMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

/**
 * RN07: aplicada depois de buscar, filtrar e ordenar. Página além da última vem vazia, e o total
 * de páginas é o total de itens ÷ limit, arredondado para cima (0 sem itens).
 */
export function paginate<T>(items: T[], page: number, limit: number): Page<T> {
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    meta: {
      page,
      limit,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / limit),
    },
  };
}
