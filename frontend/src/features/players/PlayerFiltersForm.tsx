import { useForm } from 'react-hook-form';
import type { PlayerFilters, PlayerSort } from '../../api/players.ts';
import type { Club, Condition, Position } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Input, Select } from '../../components/Input.tsx';
import {
  CONDITION_LABELS,
  CONDITIONS,
  POSITION_LABELS,
  POSITIONS,
} from '../../lib/labels.ts';

interface FilterValues {
  search: string;
  position: Position | '';
  condition: Condition | '';
  freeOnly: boolean;
  clubId: string;
  minAge: string;
  maxAge: string;
  minValue: string;
  maxValue: string;
  sort: PlayerSort;
}

const EMPTY_VALUES: FilterValues = {
  search: '',
  position: '',
  condition: '',
  freeOnly: false,
  clubId: '',
  minAge: '',
  maxAge: '',
  minValue: '',
  maxValue: '',
  sort: 'name',
};

const SORT_OPTIONS: { value: PlayerSort; label: string }[] = [
  { value: 'name', label: 'Nome' },
  { value: 'value_desc', label: 'Valor de mercado: maior primeiro' },
  { value: 'value_asc', label: 'Valor de mercado: menor primeiro' },
  { value: 'age_asc', label: 'Idade: mais novo primeiro' },
  { value: 'age_desc', label: 'Idade: mais velho primeiro' },
  { value: 'position', label: 'Posição' },
];

function optionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value);
}

function toFilters(values: FilterValues): PlayerFilters {
  return {
    search: values.search.trim() || undefined,
    position: values.position || undefined,
    condition: values.condition || undefined,
    free: values.freeOnly || undefined,
    club_id: optionalNumber(values.clubId),
    min_age: optionalNumber(values.minAge),
    max_age: optionalNumber(values.maxAge),
    min_value: optionalNumber(values.minValue),
    max_value: optionalNumber(values.maxValue),
    sort: values.sort,
  };
}

interface PlayerFiltersFormProps {
  clubs: Club[];
  onApply: (filters: PlayerFilters) => void;
}

/** Busca, filtros combináveis e ordenação; a API valida as combinações e a tela mostra o `message`. */
export function PlayerFiltersForm({ clubs, onApply }: PlayerFiltersFormProps) {
  const { register, handleSubmit, reset } = useForm<FilterValues>({
    defaultValues: EMPTY_VALUES,
  });

  function clear() {
    reset(EMPTY_VALUES);
    onApply(toFilters(EMPTY_VALUES));
  }

  return (
    <form
      role="search"
      aria-label="Filtros de jogadores"
      onSubmit={(event) =>
        void handleSubmit((values) => onApply(toFilters(values)))(event)
      }
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Buscar por nome" htmlFor="filter-search">
          <Input id="filter-search" type="search" {...register('search')} />
        </FormField>
        <FormField label="Posição" htmlFor="filter-position">
          <Select id="filter-position" {...register('position')}>
            <option value="">Todas</option>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position} – {POSITION_LABELS[position]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Condição" htmlFor="filter-condition">
          <Select id="filter-condition" {...register('condition')}>
            <option value="">Todas</option>
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {CONDITION_LABELS[condition]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Clube" htmlFor="filter-club">
          <Select id="filter-club" {...register('clubId')}>
            <option value="">Todos</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.acronym} – {club.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Idade mínima" htmlFor="filter-min-age">
          <Input id="filter-min-age" type="number" {...register('minAge')} />
        </FormField>
        <FormField label="Idade máxima" htmlFor="filter-max-age">
          <Input id="filter-max-age" type="number" {...register('maxAge')} />
        </FormField>
        <FormField label="Valor de mercado mínimo" htmlFor="filter-min-value">
          <Input
            id="filter-min-value"
            type="number"
            step="0.01"
            {...register('minValue')}
          />
        </FormField>
        <FormField label="Valor de mercado máximo" htmlFor="filter-max-value">
          <Input
            id="filter-max-value"
            type="number"
            step="0.01"
            {...register('maxValue')}
          />
        </FormField>
        <FormField label="Ordenar por" htmlFor="filter-sort">
          <Select id="filter-sort" {...register('sort')}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <label className="flex items-center gap-2 self-end py-2 text-sm font-medium text-slate-700">
          <input type="checkbox" className="size-4" {...register('freeOnly')} />
          Só livres
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={clear}>
          Limpar
        </Button>
        <Button type="submit">Filtrar</Button>
      </div>
    </form>
  );
}
