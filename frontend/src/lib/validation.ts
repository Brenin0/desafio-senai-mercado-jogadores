/** Validações de um campo só, feitas antes do envio; as regras que cruzam campos ficam na API. */

export const REQUIRED_MESSAGE = 'Campo obrigatório.';

/** Mesma limpeza da V4 (espaços nas pontas e repetidos), só para medir o tamanho. */
function collapseSpaces(value: string): string {
  return value.trim().replace(/ +/g, ' ');
}

export function textLength(min: number, max: number) {
  return (value: string) => {
    const length = [...collapseSpaces(value)].length;
    return (
      (length >= min && length <= max) || `Use de ${min} a ${max} caracteres.`
    );
  };
}

function integerBetween(min: number, max: number) {
  return (value: number) =>
    (Number.isInteger(value) && value >= min && value <= max) ||
    `Use um número inteiro de ${min} a ${max}.`;
}

/** Regras de um campo numérico inteiro do formulário (lido como número). */
export function integerField(min: number, max: number) {
  return {
    valueAsNumber: true,
    required: REQUIRED_MESSAGE,
    validate: integerBetween(min, max),
  } as const;
}
