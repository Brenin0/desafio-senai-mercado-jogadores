import { useForm } from 'react-hook-form';
import type { ClubInput } from '../../api/clubs.ts';
import { Dialog } from '../../components/Dialog.tsx';
import { Feedback } from '../../components/Feedback.tsx';
import { FormActions } from '../../components/FormActions.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Input } from '../../components/Input.tsx';
import { useCreateClub } from '../../hooks/useClubs.ts';
import { formatMoney } from '../../lib/format.ts';
import { REQUIRED_MESSAGE, textLength } from '../../lib/validation.ts';

interface ClubFormDialogProps {
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function ClubFormDialog({ onClose, onSaved }: ClubFormDialogProps) {
  const createClub = useCreateClub();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClubInput>({ defaultValues: { name: '', acronym: '' } });

  async function save(input: ClubInput) {
    try {
      const club = await createClub.mutateAsync(input);
      onSaved(
        `${club.name} foi criado com caixa de ${formatMoney(club.cash)}.`,
      );
    } catch {
      // A recusa aparece no formulário pelo `error` da mutação, com o message da API.
    }
  }

  return (
    <Dialog title="Criar clube" onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(save)(event)}
        className="space-y-4"
      >
        <FormField
          label="Nome"
          htmlFor="club-name"
          error={errors.name?.message}
        >
          <Input
            id="club-name"
            aria-invalid={errors.name ? true : undefined}
            {...register('name', {
              required: REQUIRED_MESSAGE,
              validate: textLength(3, 60),
            })}
          />
        </FormField>
        <FormField
          label="Sigla"
          htmlFor="club-acronym"
          error={errors.acronym?.message}
        >
          <Input
            id="club-acronym"
            maxLength={3}
            aria-invalid={errors.acronym ? true : undefined}
            {...register('acronym', {
              required: REQUIRED_MESSAGE,
              pattern: {
                value: /^[A-Z]{3}$/,
                message: 'Use 3 letras maiúsculas, de A a Z.',
              },
            })}
          />
        </FormField>
        <Feedback
          message={
            createClub.error && {
              kind: 'error',
              text: createClub.error.message,
            }
          }
        />
        <FormActions
          submitLabel="Criar clube"
          isSubmitting={isSubmitting}
          onCancel={onClose}
        />
      </form>
    </Dialog>
  );
}
