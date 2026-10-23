import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Formation, Player, SquadPlayer } from '../../api/types.ts';
import { ConditionBadge } from '../../components/ConditionBadge.tsx';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { Feedback, type FeedbackMessage } from '../../components/Feedback.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Select } from '../../components/Input.tsx';
import { Button } from '../../components/Button.tsx';
import { useLineup, useSaveLineup } from '../../hooks/useLeague.ts';
import { REQUIRED_MESSAGE } from '../../lib/validation.ts';
import { FORMATIONS, lineupSlots } from './formations.ts';

interface LineupFormValues {
  formation: Formation | '';
  slots: string[];
}

const EMPTY_SLOTS = ['', '', '', '', ''];

const COLUMNS: Column<Player>[] = [
  {
    header: 'Nome',
    cell: (player) => (
      <span className="font-medium text-slate-900">{player.name}</span>
    ),
  },
  { header: 'Posição', cell: (player) => player.position },
  {
    header: 'Condição',
    cell: (player) => <ConditionBadge condition={player.condition} />,
  },
];

interface LineupSectionProps {
  clubId: number;
  squad: SquadPlayer[];
}

/** Escalação salva (como a API devolve) e o formulário para escalar de novo. */
export function LineupSection({ clubId, squad }: LineupSectionProps) {
  const lineup = useLineup(clubId);
  const saveLineup = useSaveLineup(clubId);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LineupFormValues>({
    defaultValues: { formation: '', slots: EMPTY_SLOTS },
  });
  const formation = useWatch({ control, name: 'formation' });
  const chosen = useWatch({ control, name: 'slots' });
  const available = squad.filter((player) => player.condition !== 'DOENTE');

  async function save(values: LineupFormValues) {
    setFeedback(null);
    try {
      const saved = await saveLineup.mutateAsync({
        formation: values.formation as Formation,
        player_ids: values.slots.map(Number),
      });
      setFeedback({
        kind: 'success',
        text: `Escalação salva no ${saved.formation ?? ''}.`,
      });
    } catch {
      // A recusa aparece pelo `error` da mutação, com o message da API.
    }
  }

  function resetLineSlots() {
    for (let index = 1; index < EMPTY_SLOTS.length; index++) {
      setValue(`slots.${index}`, '');
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Escalação atual
          {lineup.data?.formation && ` · ${lineup.data.formation}`}
        </h2>
        {lineup.data && !lineup.data.complete && (
          <Feedback
            message={{
              kind: 'warning',
              text: 'Escalação incompleta: o clube não pode jogar até escalar os 5 titulares.',
            }}
          />
        )}
        <DataTable
          caption="Titulares do clube"
          columns={COLUMNS}
          rows={lineup.data?.players}
          rowKey={(player) => player.id}
          isLoading={lineup.isLoading}
          error={lineup.error}
          emptyMessage="Nenhum titular escalado."
        />
      </div>

      <form
        noValidate
        aria-label="Escalar titulares"
        onSubmit={(event) => void handleSubmit(save)(event)}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          Escalar titulares
        </h2>
        <div className="max-w-xs">
          <FormField
            label="Formação"
            htmlFor="lineup-formation"
            error={errors.formation?.message}
          >
            <Select
              id="lineup-formation"
              aria-invalid={errors.formation ? true : undefined}
              {...register('formation', {
                required: REQUIRED_MESSAGE,
                onChange: resetLineSlots,
              })}
            >
              <option value="">Escolha a formação</option>
              {FORMATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        {formation && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lineupSlots(formation).map((slot, index) => (
              <FormField
                key={slot.label}
                label={slot.label}
                htmlFor={`lineup-slot-${index}`}
                error={errors.slots?.[index]?.message}
              >
                <Select
                  id={`lineup-slot-${index}`}
                  aria-invalid={errors.slots?.[index] ? true : undefined}
                  {...register(`slots.${index}`, {
                    required: REQUIRED_MESSAGE,
                  })}
                >
                  <option value="">Escolha o titular</option>
                  {available
                    .filter(
                      (player) =>
                        slot.positions.includes(player.position) &&
                        !chosen.some(
                          (id, other) =>
                            other !== index && id === String(player.id),
                        ),
                    )
                    .map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.position})
                      </option>
                    ))}
                </Select>
              </FormField>
            ))}
          </div>
        )}
        <Feedback
          message={
            saveLineup.error
              ? { kind: 'error', text: saveLineup.error.message }
              : feedback
          }
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Salvar escalação'}
          </Button>
        </div>
      </form>
    </section>
  );
}
