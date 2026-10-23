export interface FeedbackMessage {
  kind: 'success' | 'warning' | 'error';
  text: string;
}

const KIND_CLASS_NAMES: Record<FeedbackMessage['kind'], string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

interface FeedbackProps {
  message: FeedbackMessage | null;
  onClose?: () => void;
}

/** Aviso de sucesso de uma ação, de atenção ou do `message` devolvido pela API. */
export function Feedback({ message, onClose }: FeedbackProps) {
  if (!message) {
    return null;
  }
  const isError = message.kind === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${KIND_CLASS_NAMES[message.kind]}`}
    >
      <p>{message.text}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar aviso"
          className="font-semibold opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
