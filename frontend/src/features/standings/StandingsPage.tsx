import type { Standing } from '../../api/types.ts';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { useStandings } from '../../hooks/useLeague.ts';

const COLUMNS: Column<Standing>[] = [
  { header: 'Posição', cell: (row) => `${row.position}º`, align: 'right' },
  {
    header: 'Clube',
    cell: (row) => (
      <span className="font-medium text-slate-900">{row.club_name}</span>
    ),
  },
  { header: 'Jogos', cell: (row) => row.played, align: 'right' },
  { header: 'Vitórias', cell: (row) => row.wins, align: 'right' },
  { header: 'Empates', cell: (row) => row.draws, align: 'right' },
  { header: 'Derrotas', cell: (row) => row.losses, align: 'right' },
  { header: 'Gols marcados', cell: (row) => row.goals_for, align: 'right' },
  { header: 'Gols sofridos', cell: (row) => row.goals_against, align: 'right' },
  { header: 'Saldo', cell: (row) => row.goal_difference, align: 'right' },
  {
    header: 'Pontos',
    cell: (row) => <span className="font-semibold">{row.points}</span>,
    align: 'right',
  },
];

/** Classificação na ordem devolvida por `GET /standings`, sem reordenar nem recalcular. */
export function StandingsPage() {
  const standings = useStandings();
  return (
    <div className="space-y-4">
      <PageHeader title="Classificação" />
      <DataTable
        caption="Classificação"
        columns={COLUMNS}
        rows={standings.data}
        rowKey={(row) => row.club_id}
        isLoading={standings.isLoading}
        error={standings.error}
        emptyMessage="Nenhum clube na classificação."
      />
    </div>
  );
}
