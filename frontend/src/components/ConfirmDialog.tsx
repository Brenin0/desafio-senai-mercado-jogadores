import type { ReactNode } from 'react';
import { Button } from './Button.tsx';
import { Dialog } from './Dialog.tsx';
import { Feedback } from './Feedback.tsx';

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  isPending: boolean;
  error: Error | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmação de uma ação: o botão fica desabilitado enquanto o pedido está em andamento. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <div className="space-y-4">
        <div className="text-sm text-slate-700">{children}</div>
        <Feedback message={error && { kind: 'error', text: error.message }} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Enviando…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
