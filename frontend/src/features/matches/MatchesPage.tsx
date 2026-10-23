import { useState } from 'react';
import type { Match, MatchDetail } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { Feedback } from '../../components/Feedback.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Select } from '../../components/Input.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { useClubs } from '../../hooks/useClubs.ts';
import { useMatches } from '../../hooks/useLeague.ts';
import { formatDateTime } from '../../lib/format.ts';
import { MatchDetailDialog } from './MatchDetailDialog.tsx';
import { MatchResultView } from './MatchResultView.tsx';
import { PlayMatchForm } from './PlayMatchForm.tsx';

/** Partidas: jogar, ver o resultado com os duelos e o histórico da mais recente para a mais antiga. */
export function MatchesPage() {
  const clubs = useClubs();
  const [clubFilter, setClubFilter] = useState<number | undefined>();
  const matches = useMatches(clubFilter);
  const [lastMatch, setLastMatch] = useState<MatchDetail | null>(null);
  const [openMatchId, setOpenMatchId] = useState<number | null>(null);

  const columns: Column<Match>[] = [
    {
      header: 'Data e hora',
      cell: (match) => formatDateTime(match.played_at),
    },
    { header: 'Mandante', cell: (match) => match.home.club_name },
    {
      header: 'Placar',
      cell: (match) => (
        <span className="font-semibold">
          {match.home.goals} × {match.away.goals}
        </span>
      ),
    },
    { header: 'Visitante', cell: (match) => match.away.club_name },
    {
      header: 'Ações',
      cell: (match) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOpenMatchId(match.id)}
        >
          Ver duelos
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Partidas" />
      <PlayMatchForm clubs={clubs.data ?? []} onPlayed={setLastMatch} />
      {lastMatch && (
        <section className="space-y-3">
          <Feedback
            message={{
              kind: 'success',
              text: `Partida jogada: ${lastMatch.home.club_name} ${lastMatch.home.goals} × ${lastMatch.away.goals} ${lastMatch.away.club_name}.`,
            }}
            onClose={() => setLastMatch(null)}
          />
          <MatchResultView match={lastMatch} />
        </section>
      )}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Histórico de partidas
          </h2>
          <div className="w-56">
            <FormField label="Clube" htmlFor="matches-club">
              <Select
                id="matches-club"
                value={clubFilter ?? ''}
                onChange={(event) =>
                  setClubFilter(
                    event.target.value === ''
                      ? undefined
                      : Number(event.target.value),
                  )
                }
              >
                <option value="">Todos</option>
                {clubs.data?.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.acronym} – {club.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
        <DataTable
          caption="Histórico de partidas"
          columns={columns}
          rows={matches.data}
          rowKey={(match) => match.id}
          isLoading={matches.isLoading}
          error={matches.error}
          emptyMessage="Nenhuma partida jogada."
        />
      </section>
      {openMatchId !== null && (
        <MatchDetailDialog
          matchId={openMatchId}
          onClose={() => setOpenMatchId(null)}
        />
      )}
    </div>
  );
}
