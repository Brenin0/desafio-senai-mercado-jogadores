import { Button } from './Button.tsx';

interface FormActionsProps {
  submitLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
}

/** Botões do formulário: o envio fica desabilitado enquanto o pedido está em andamento. */
export function FormActions({
  submitLabel,
  isSubmitting,
  onCancel,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando…' : submitLabel}
      </Button>
    </div>
  );
}
