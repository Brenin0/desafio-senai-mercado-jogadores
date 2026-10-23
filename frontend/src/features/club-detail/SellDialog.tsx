import { useState } from 'react';
import type { Sale, SquadPlayer } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { Dialog } from '../../components/Dialog.tsx';
import { ResultSummary } from '../../components/ResultSummary.tsx';
import { useSellPlayer } from '../../hooks/useMarket.ts';
import { formatMoney } from '../../lib/format.ts';

interface SellDialogProps {
  player: SquadPlayer;
  onClose: () => void;
}

function saleItems(sale: Sale) {
  return [
    { label: 'Valor de compra', value: formatMoney(sale.purchase_value) },
    { label: 'Valor de venda', value: formatMoney(sale.value) },
    { label: 'Dias restantes', value: String(sale.remaining_days) },
    { label: 'Multa', value: formatMoney(sale.penalty) },
    { label: 'Lucro', value: formatMoney(sale.profit) },
    { label: 'Comissão', value: formatMoney(sale.fee) },
    { label: 'Crédito', value: formatMoney(sale.cash_change) },
    { label: 'Novo caixa', value: formatMoney(sale.club_cash) },
  ];
}

/** Venda com confirmação antes do envio e o resultado devolvido pela API. */
export function SellDialog({ player, onClose }: SellDialogProps) {
  const sellPlayer = useSellPlayer();
  const [sale, setSale] = useState<Sale | null>(null);

  if (sale) {
    return (
      <Dialog title={`Vender ${player.name}`} onClose={onClose}>
        <div className="space-y-4">
          <ResultSummary
            title={`Venda concluída: ${sale.player_name}`}
            items={saleItems(sale)}
          />
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <ConfirmDialog
      title={`Vender ${player.name}`}
      confirmLabel="Confirmar venda"
      error={sellPlayer.error}
      onConfirm={() => sellPlayer.mutateAsync(player.id).then(setSale)}
      onCancel={onClose}
    >
      Vender <strong>{player.name}</strong> pelo valor de mercado de{' '}
      <strong>{formatMoney(player.market_value)}</strong>? Faltam{' '}
      {player.contract.remaining_days} dias de fidelidade (multa de{' '}
      {player.contract.penalty_rate}%).
    </ConfirmDialog>
  );
}
