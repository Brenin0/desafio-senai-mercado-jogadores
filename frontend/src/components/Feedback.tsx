export interface FeedbackMessage {
  kind: 'success' | 'error';
  text: string;
}

interface FeedbackProps {
  message: FeedbackMessage | null;
  onClose?: () => void;
}

/** Aviso de sucesso de uma ação ou do `message` devolvido pela API. */
export function Feedback({ message, onClose }: FeedbackProps) {
  if (!message) {
    return null;
  }
  const isError = message.kind === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-green-200 bg-green-50 text-green-800'
      }`}
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
