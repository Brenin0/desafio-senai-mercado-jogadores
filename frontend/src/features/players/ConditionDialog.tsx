import { useForm } from 'react-hook-form';
import type { Condition, Player } from '../../api/types.ts';
import { ConditionBadge } from '../../components/ConditionBadge.tsx';
import { Dialog } from '../../components/Dialog.tsx';
import { Feedback } from '../../components/Feedback.tsx';
import { FormActions } from '../../components/FormActions.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Select } from '../../components/Input.tsx';
import { useChangePlayerCondition } from '../../hooks/usePlayers.ts';
import { formatMoney } from '../../lib/format.ts';
import { CONDITION_LABELS, CONDITIONS } from '../../lib/labels.ts';
import { REQUIRED_MESSAGE } from '../../lib/validation.ts';

interface ConditionFormValues {
  condition: Condition;
}

interface ConditionDialogProps {
  player: Player;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function ConditionDialog({
  player,
  onClose,
  onSaved,
}: ConditionDialogProps) {
  const changeCondition = useChangePlayerCondition();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConditionFormValues>({
    defaultValues: { condition: player.condition },
  });

  async function save({ condition }: ConditionFormValues) {
    try {
      const saved = await changeCondition.mutateAsync({
        id: player.id,
        condition,
      });
      onSaved(
        `${saved.name} agora está ${CONDITION_LABELS[saved.condition].toLowerCase()}, com valor de mercado ${formatMoney(saved.market_value)}.`,
      );
    } catch {
      // A recusa aparece no formulário pelo `error` da mutação, com o message da API.
    }
  }

  return (
    <Dialog title={`Condição de ${player.name}`} onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(save)(event)}
        className="space-y-4"
      >
        <p className="text-sm text-slate-700">
          Condição atual: <ConditionBadge condition={player.condition} />
        </p>
        <FormField
          label="Nova condição"
          htmlFor="player-condition"
          error={errors.condition?.message}
        >
          <Select
            id="player-condition"
            {...register('condition', { required: REQUIRED_MESSAGE })}
          >
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {CONDITION_LABELS[condition]}
              </option>
            ))}
          </Select>
        </FormField>
        <Feedback
          message={
            changeCondition.error && {
              kind: 'error',
              text: changeCondition.error.message,
            }
          }
        />
        <FormActions
          submitLabel="Alterar condição"
          isSubmitting={isSubmitting}
          onCancel={onClose}
        />
      </form>
    </Dialog>
  );
}
