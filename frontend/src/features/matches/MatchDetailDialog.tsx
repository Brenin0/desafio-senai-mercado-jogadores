import { Button } from '../../components/Button.tsx';
import { Dialog } from '../../components/Dialog.tsx';
import { Feedback } from '../../components/Feedback.tsx';
import { useMatch } from '../../hooks/useLeague.ts';
import { MatchResultView } from './MatchResultView.tsx';

interface MatchDetailDialogProps {
  matchId: number;
  onClose: () => void;
}

/** Partida aberta do histórico, com os 6 duelos de `GET /matches/{id}`. */
export function MatchDetailDialog({
  matchId,
  onClose,
}: MatchDetailDialogProps) {
  const match = useMatch(matchId);
  return (
    <Dialog title={`Partida ${matchId}`} onClose={onClose}>
      <div className="space-y-4">
        {match.isLoading && (
          <p role="status" className="text-sm text-slate-500">
            Carregando…
          </p>
        )}
        <Feedback
          message={match.error && { kind: 'error', text: match.error.message }}
        />
        {match.data && <MatchResultView match={match.data} />}
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
