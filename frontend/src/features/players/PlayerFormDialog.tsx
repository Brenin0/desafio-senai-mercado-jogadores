import { useForm } from 'react-hook-form';
import type { PlayerUpdate } from '../../api/players.ts';
import type { Player, Position } from '../../api/types.ts';
import { Dialog } from '../../components/Dialog.tsx';
import { Feedback } from '../../components/Feedback.tsx';
import { FormActions } from '../../components/FormActions.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Input, Select } from '../../components/Input.tsx';
import { useCreatePlayer, useUpdatePlayer } from '../../hooks/usePlayers.ts';
import { formatMoney } from '../../lib/format.ts';
import { POSITION_LABELS, POSITIONS } from '../../lib/labels.ts';
import {
  integerField,
  REQUIRED_MESSAGE,
  textLength,
} from '../../lib/validation.ts';

interface PlayerFormValues {
  name: string;
  position: Position | '';
  agility: number;
  age: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
}

type IndicatorField =
  | 'pace'
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'defending'
  | 'physical'
  | 'potential';

const INDICATORS: { field: IndicatorField; label: string }[] = [
  { field: 'pace', label: 'Velocidade' },
  { field: 'shooting', label: 'Finalização' },
  { field: 'passing', label: 'Passe' },
  { field: 'dribbling', label: 'Drible' },
  { field: 'defending', label: 'Defesa' },
  { field: 'physical', label: 'Físico' },
  { field: 'potential', label: 'Potencial' },
];

interface PlayerFormDialogProps {
  player?: Player;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** Cadastro (com os sete indicadores) ou edição (nome, posição, agilidade e idade) de um jogador. */
export function PlayerFormDialog({
  player,
  onClose,
  onSaved,
}: PlayerFormDialogProps) {
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const error = player ? updatePlayer.error : createPlayer.error;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlayerFormValues>({
    defaultValues: player
      ? {
          name: player.name,
          position: player.position,
          agility: player.agility,
          age: player.age,
        }
      : { name: '', position: '' },
  });

  async function save(values: PlayerFormValues) {
    const update: PlayerUpdate = {
      name: values.name,
      position: values.position as Position,
      agility: values.agility,
      age: values.age,
    };
    try {
      if (player) {
        const saved = await updatePlayer.mutateAsync({
          id: player.id,
          input: update,
        });
        onSaved(`${saved.name} foi atualizado.`);
      } else {
        const saved = await createPlayer.mutateAsync({
          ...update,
          pace: values.pace,
          shooting: values.shooting,
          passing: values.passing,
          dribbling: values.dribbling,
          defending: values.defending,
          physical: values.physical,
          potential: values.potential,
        });
        onSaved(
          `${saved.name} foi cadastrado com overall ${saved.overall} e valor base ${formatMoney(saved.base_value)}.`,
        );
      }
    } catch {
      // A recusa aparece no formulário pelo `error` da mutação, com o message da API.
    }
  }

  return (
    <Dialog
      title={player ? `Editar ${player.name}` : 'Cadastrar jogador'}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(save)(event)}
        className="space-y-4"
      >
        <FormField
          label="Nome"
          htmlFor="player-name"
          error={errors.name?.message}
        >
          <Input
            id="player-name"
            aria-invalid={errors.name ? true : undefined}
            {...register('name', {
              required: REQUIRED_MESSAGE,
              validate: textLength(3, 100),
            })}
          />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            label="Posição"
            htmlFor="player-position"
            error={errors.position?.message}
          >
            <Select
              id="player-position"
              aria-invalid={errors.position ? true : undefined}
              {...register('position', { required: REQUIRED_MESSAGE })}
            >
              <option value="">Escolha</option>
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position} – {POSITION_LABELS[position]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="Agilidade"
            htmlFor="player-agility"
            error={errors.agility?.message}
          >
            <Input
              id="player-agility"
              type="number"
              aria-invalid={errors.agility ? true : undefined}
              {...register('agility', integerField(1, 100))}
            />
          </FormField>
          <FormField
            label="Idade"
            htmlFor="player-age"
            error={errors.age?.message}
          >
            <Input
              id="player-age"
              type="number"
              aria-invalid={errors.age ? true : undefined}
              {...register('age', integerField(16, 45))}
            />
          </FormField>
        </div>
        {!player && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-900">
              Indicadores (1 a 99)
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {INDICATORS.map(({ field, label }) => (
                <FormField
                  key={field}
                  label={label}
                  htmlFor={`player-${field}`}
                  error={errors[field]?.message}
                >
                  <Input
                    id={`player-${field}`}
                    type="number"
                    aria-invalid={errors[field] ? true : undefined}
                    {...register(field, integerField(1, 99))}
                  />
                </FormField>
              ))}
            </div>
          </fieldset>
        )}
        <Feedback message={error && { kind: 'error', text: error.message }} />
        <FormActions
          submitLabel={player ? 'Salvar' : 'Cadastrar'}
          isSubmitting={isSubmitting}
          onCancel={onClose}
        />
      </form>
    </Dialog>
  );
}
