import { useParams } from 'react-router';
import { PageHeader } from '../../components/PageHeader.tsx';
import { useClub } from '../../hooks/useClubs.ts';
import { formatMoney } from '../../lib/format.ts';
import { SquadSection } from './SquadSection.tsx';

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-slate-900">
        {value === undefined ? '—' : formatMoney(value)}
      </dd>
    </div>
  );
}

/** Página do clube: caixa, valor do elenco, patrimônio e elenco, como a API devolve. */
export function ClubPage() {
  const clubId = Number(useParams().id);
  const club = useClub(clubId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={club.data ? `${club.data.name} (${club.data.acronym})` : 'Clube'}
      />
      <dl className="grid gap-3 sm:grid-cols-3">
        <Stat label="Caixa" value={club.data?.cash} />
        <Stat label="Valor do elenco" value={club.data?.squad_value} />
        <Stat label="Patrimônio" value={club.data?.net_worth} />
      </dl>
      <SquadSection
        players={club.data?.players}
        isLoading={club.isLoading}
        error={club.error}
      />
    </div>
  );
}
