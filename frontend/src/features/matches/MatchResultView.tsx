import type { Duel, DuelPlayer, MatchDetail } from '../../api/types.ts';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { formatDateTime } from '../../lib/format.ts';
import { ATTRIBUTE_LABELS } from '../../lib/labels.ts';

function playerLabel(player: DuelPlayer): string {
  return `${player.player_name} (${player.position})`;
}

function attributeLabel(player: DuelPlayer): string {
  return ATTRIBUTE_LABELS[player.attribute] ?? player.attribute;
}

/** Placar e os 6 duelos devolvidos pela API, sem recalcular nada. */
export function MatchResultView({ match }: { match: MatchDetail }) {
  const clubNames = new Map([
    [match.home.club_id, match.home.club_name],
    [match.away.club_id, match.away.club_name],
  ]);

  const columns: Column<Duel>[] = [
    { header: 'Duelo', cell: (duel) => duel.order, align: 'right' },
    {
      header: 'Ataca',
      cell: (duel) => clubNames.get(duel.attacking_club_id),
    },
    { header: 'Atacante', cell: (duel) => playerLabel(duel.attacker) },
    {
      header: 'Atributo do atacante',
      cell: (duel) => attributeLabel(duel.attacker),
    },
    { header: 'Valor', cell: (duel) => duel.attacker.value, align: 'right' },
    { header: 'Defensor', cell: (duel) => playerLabel(duel.defender) },
    {
      header: 'Atributo do defensor',
      cell: (duel) => attributeLabel(duel.defender),
    },
    { header: 'Valor', cell: (duel) => duel.defender.value, align: 'right' },
    {
      header: 'Gol',
      cell: (duel) =>
        duel.goal ? (
          <span className="font-semibold text-green-700">Gol</span>
        ) : (
          'Não'
        ),
    },
  ];

  return (
    <div className="space-y-3">
      <div
        aria-label="Placar"
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white p-4 text-center"
      >
        <span className="font-semibold text-slate-900">
          {match.home.club_name}{' '}
          <span className="text-sm font-normal text-slate-500">
            ({match.home.formation})
          </span>
        </span>
        <span className="text-2xl font-bold text-slate-900">
          {match.home.goals} × {match.away.goals}
        </span>
        <span className="font-semibold text-slate-900">
          {match.away.club_name}{' '}
          <span className="text-sm font-normal text-slate-500">
            ({match.away.formation})
          </span>
        </span>
        <span className="w-full text-sm text-slate-500">
          {formatDateTime(match.played_at)}
        </span>
      </div>
      <DataTable
        caption="Duelos da partida"
        columns={columns}
        rows={match.duels}
        rowKey={(duel) => duel.order}
        isLoading={false}
        error={null}
        emptyMessage="Nenhum duelo."
      />
    </div>
  );
}
