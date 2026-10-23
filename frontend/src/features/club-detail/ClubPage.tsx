import { useState } from 'react';
import { useParams } from 'react-router';
import { PageHeader } from '../../components/PageHeader.tsx';
import { Tabs } from '../../components/Tabs.tsx';
import { useClub } from '../../hooks/useClubs.ts';
import { formatMoney } from '../../lib/format.ts';
import { SquadSection } from './SquadSection.tsx';
import { TransactionsSection } from './TransactionsSection.tsx';

type ClubTab = 'squad' | 'history';

const TABS: { id: ClubTab; label: string }[] = [
  { id: 'squad', label: 'Elenco' },
  { id: 'history', label: 'Histórico' },
];

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

/** Página do clube: caixa, valor do elenco, patrimônio e as abas do elenco e do histórico. */
export function ClubPage() {
  const clubId = Number(useParams().id);
  const club = useClub(clubId);
  const [tab, setTab] = useState<ClubTab>('squad');

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
      <Tabs
        label="Seções do clube"
        tabs={TABS}
        active={tab}
        onChange={setTab}
      />
      {tab === 'squad' && (
        <SquadSection
          players={club.data?.players}
          isLoading={club.isLoading}
          error={club.error}
        />
      )}
      {tab === 'history' && <TransactionsSection clubId={clubId} />}
    </div>
  );
}
