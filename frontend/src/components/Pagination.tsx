import { Button } from './Button.tsx';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalLabel: string;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalLabel,
  onPageChange,
}: PaginationProps) {
  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"
    >
      <p>{totalLabel}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <span>
          Página {page} de {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Próxima
        </Button>
      </div>
    </nav>
  );
}
