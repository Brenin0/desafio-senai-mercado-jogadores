import { useState } from 'react';
import type { SquadPlayer } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { ConditionBadge } from '../../components/ConditionBadge.tsx';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { formatDateTime, formatMoney } from '../../lib/format.ts';
import { SellDialog } from './SellDialog.tsx';

interface SquadSectionProps {
  players: SquadPlayer[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

/** Elenco na ordem da RN11, com as colunas do contrato e o botão Vender. */
export function SquadSection({ players, isLoading, error }: SquadSectionProps) {
  const [playerToSell, setPlayerToSell] = useState<SquadPlayer | null>(null);

  const columns: Column<SquadPlayer>[] = [
    {
      header: 'Nome',
      cell: (player) => (
        <span className="font-medium text-slate-900">{player.name}</span>
      ),
    },
    { header: 'Posição', cell: (player) => player.position },
    { header: 'Overall', cell: (player) => player.overall, align: 'right' },
    {
      header: 'Condição',
      cell: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      header: 'Valor de mercado',
      cell: (player) => formatMoney(player.market_value),
      align: 'right',
    },
    {
      header: 'Fim da fidelidade',
      cell: (player) => formatDateTime(player.contract.loyalty_until),
    },
    {
      header: 'Dias restantes',
      cell: (player) => player.contract.remaining_days,
      align: 'right',
    },
    {
      header: '% de multa',
      cell: (player) => `${player.contract.penalty_rate}%`,
      align: 'right',
    },
    {
      header: 'Ações',
      cell: (player) => (
        <Button
          size="sm"
          variant="danger"
          onClick={() => setPlayerToSell(player)}
        >
          Vender
        </Button>
      ),
    },
  ];

  return (
    <section className="space-y-3">
      <DataTable
        caption="Elenco do clube"
        columns={columns}
        rows={players}
        rowKey={(player) => player.id}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhum jogador no elenco."
      />
      {playerToSell && (
        <SellDialog
          player={playerToSell}
          onClose={() => setPlayerToSell(null)}
        />
      )}
    </section>
  );
}
