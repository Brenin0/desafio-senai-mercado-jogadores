import { useForm } from 'react-hook-form';
import type { Club, MatchDetail } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { Feedback } from '../../components/Feedback.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Select } from '../../components/Input.tsx';
import { usePlayMatch } from '../../hooks/useLeague.ts';
import { REQUIRED_MESSAGE } from '../../lib/validation.ts';

interface MatchFormValues {
  homeClubId: string;
  awayClubId: string;
}

interface PlayMatchFormProps {
  clubs: Club[];
  onPlayed: (match: MatchDetail) => void;
}

/** Nova partida: mandante e visitante obrigatórios; as recusas mostram o `message` da API. */
export function PlayMatchForm({ clubs, onPlayed }: PlayMatchFormProps) {
  const playMatch = usePlayMatch();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MatchFormValues>({
    defaultValues: { homeClubId: '', awayClubId: '' },
  });

  async function play(values: MatchFormValues) {
    try {
      onPlayed(
        await playMatch.mutateAsync({
          home_club_id: Number(values.homeClubId),
          away_club_id: Number(values.awayClubId),
        }),
      );
    } catch {
      // A recusa aparece pelo `error` da mutação, com o message da API.
    }
  }

  const options = clubs.map((club) => (
    <option key={club.id} value={club.id}>
      {club.acronym} – {club.name}
    </option>
  ));

  return (
    <form
      noValidate
      aria-label="Nova partida"
      onSubmit={(event) => void handleSubmit(play)(event)}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-lg font-semibold text-slate-900">Nova partida</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Mandante"
          htmlFor="match-home"
          error={errors.homeClubId?.message}
        >
          <Select
            id="match-home"
            aria-invalid={errors.homeClubId ? true : undefined}
            {...register('homeClubId', { required: REQUIRED_MESSAGE })}
          >
            <option value="">Escolha o mandante</option>
            {options}
          </Select>
        </FormField>
        <FormField
          label="Visitante"
          htmlFor="match-away"
          error={errors.awayClubId?.message}
        >
          <Select
            id="match-away"
            aria-invalid={errors.awayClubId ? true : undefined}
            {...register('awayClubId', { required: REQUIRED_MESSAGE })}
          >
            <option value="">Escolha o visitante</option>
            {options}
          </Select>
        </FormField>
      </div>
      <Feedback
        message={
          playMatch.error && { kind: 'error', text: playMatch.error.message }
        }
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Jogando…' : 'Jogar partida'}
        </Button>
      </div>
    </form>
  );
}
