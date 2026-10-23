import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Player, Purchase } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { Dialog } from '../../components/Dialog.tsx';
import { Feedback } from '../../components/Feedback.tsx';
import { FormActions } from '../../components/FormActions.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Input, Select } from '../../components/Input.tsx';
import { ResultSummary } from '../../components/ResultSummary.tsx';
import { useClubs } from '../../hooks/useClubs.ts';
import { useBuyPlayer } from '../../hooks/useMarket.ts';
import { toApiDateTime } from '../../lib/datetime.ts';
import { formatDateTime, formatMoney } from '../../lib/format.ts';
import { REQUIRED_MESSAGE } from '../../lib/validation.ts';

interface BuyFormValues {
  clubId: string;
  loyaltyUntil: string;
}

interface BuyDialogProps {
  player: Player;
  onClose: () => void;
}

function purchaseItems(purchase: Purchase) {
  return [
    { label: 'Valor', value: formatMoney(purchase.value) },
    { label: 'Taxa', value: formatMoney(purchase.fee) },
    {
      label: 'Custo total (valor + taxa)',
      value: formatMoney(purchase.value + purchase.fee),
    },
    {
      label: 'Fim da fidelidade',
      value: formatDateTime(purchase.contract.loyalty_until),
    },
    { label: 'Novo caixa', value: formatMoney(purchase.club_cash) },
  ];
}

/** Compra de jogador livre: clube, fim da fidelidade no horário de Brasília e o resultado da API. */
export function BuyDialog({ player, onClose }: BuyDialogProps) {
  const clubs = useClubs();
  const buyPlayer = useBuyPlayer();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BuyFormValues>({
    defaultValues: { clubId: '', loyaltyUntil: '' },
  });

  async function buy(values: BuyFormValues) {
    try {
      setPurchase(
        await buyPlayer.mutateAsync({
          playerId: player.id,
          input: {
            club_id: Number(values.clubId),
            loyalty_until: toApiDateTime(values.loyaltyUntil),
          },
        }),
      );
    } catch {
      // A recusa aparece no formulário pelo `error` da mutação, com o message da API.
    }
  }

  if (purchase) {
    return (
      <Dialog title={`Comprar ${player.name}`} onClose={onClose}>
        <div className="space-y-4">
          <ResultSummary
            title={`Compra concluída: ${purchase.player_name}`}
            items={purchaseItems(purchase)}
          />
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title={`Comprar ${player.name}`} onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(buy)(event)}
        className="space-y-4"
      >
        <p className="text-sm text-slate-700">
          Valor de mercado: <strong>{formatMoney(player.market_value)}</strong>
        </p>
        <FormField
          label="Clube"
          htmlFor="buy-club"
          error={errors.clubId?.message}
        >
          <Select
            id="buy-club"
            aria-invalid={errors.clubId ? true : undefined}
            {...register('clubId', { required: REQUIRED_MESSAGE })}
          >
            <option value="">Escolha o clube</option>
            {clubs.data?.map((club) => (
              <option key={club.id} value={club.id}>
                {club.acronym} – {club.name} (caixa {formatMoney(club.cash)})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Fim da fidelidade (horário de Brasília)"
          htmlFor="buy-loyalty-until"
          error={errors.loyaltyUntil?.message}
        >
          <Input
            id="buy-loyalty-until"
            type="datetime-local"
            aria-invalid={errors.loyaltyUntil ? true : undefined}
            {...register('loyaltyUntil', { required: REQUIRED_MESSAGE })}
          />
        </FormField>
        <Feedback
          message={
            buyPlayer.error && { kind: 'error', text: buyPlayer.error.message }
          }
        />
        <FormActions
          submitLabel="Confirmar compra"
          isSubmitting={isSubmitting}
          onCancel={onClose}
        />
      </form>
    </Dialog>
  );
}
