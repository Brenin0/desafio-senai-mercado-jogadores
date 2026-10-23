import type { Player } from '../../api/types.ts';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { useDeletePlayer } from '../../hooks/usePlayers.ts';

interface DeletePlayerDialogProps {
  player: Player;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeletePlayerDialog({
  player,
  onClose,
  onDeleted,
}: DeletePlayerDialogProps) {
  const deletePlayer = useDeletePlayer();
  return (
    <ConfirmDialog
      title="Excluir jogador"
      confirmLabel="Excluir"
      isPending={deletePlayer.isPending}
      error={deletePlayer.error}
      onConfirm={() => deletePlayer.mutate(player.id, { onSuccess: onDeleted })}
      onCancel={onClose}
    >
      Excluir <strong>{player.name}</strong>? Ele sai da lista de jogadores.
    </ConfirmDialog>
  );
}
