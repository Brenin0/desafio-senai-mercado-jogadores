import type { Condition } from '../api/types.ts';
import { CONDITION_LABELS } from '../lib/labels.ts';

const CONDITION_CLASS_NAMES: Record<Condition, string> = {
  APTO: 'bg-green-50 text-green-700',
  MAL_CONDICIONADO: 'bg-amber-50 text-amber-700',
  DOENTE: 'bg-red-50 text-red-700',
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONDITION_CLASS_NAMES[condition]}`}
    >
      {CONDITION_LABELS[condition]}
    </span>
  );
}
