import { useState, type ReactNode } from 'react';
import { Button } from './Button.tsx';
import { Dialog } from './Dialog.tsx';
import { Feedback } from './Feedback.tsx';

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  error: Error | null;
  onConfirm: () => Promise<unknown>;
  onCancel: () => void;
}

/**
 * Confirmação de uma ação: o botão fica desabilitado desde o clique até a resposta,
 * então o clique duplo envia um só pedido.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function confirm() {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch {
      // A recusa aparece pela propriedade `error`, com o message da API.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog title={title} onClose={onCancel}>
      <div className="space-y-4">
        <div className="text-sm text-slate-700">{children}</div>
        <Feedback message={error && { kind: 'error', text: error.message }} />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => void confirm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
