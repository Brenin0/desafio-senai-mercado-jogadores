/** V4: tira os espaços (U+0020) das pontas e junta os repetidos num só. */
export function normalizeSpaces(text: string): string {
  return text.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ');
}

/** V4: caracteres de controle (categoria Unicode Cc), como tabulação e quebra de linha. */
export function hasControlCharacter(text: string): boolean {
  return /\p{Cc}/u.test(text);
}

/** V4: tamanho em caracteres, cada um um ponto de código Unicode. */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

/** V4: palavras são as sequências sem espaço com pelo menos uma letra (categoria Unicode L). */
export function countWords(text: string): number {
  return text.split(' ').filter((part) => /\p{L}/u.test(part)).length;
}

/** Limites de cada campo: dígito vai de 0 a 9. */
export function hasDigit(text: string): boolean {
  return /[0-9]/.test(text);
}

/** Minúsculas e sem acentos: NFD sem as marcas da categoria Unicode Mn (inclui a cedilha). */
function foldCaseAndAccents(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '');
}

function compareCodePoints(a: string, b: string): number {
  const left = Array.from(a, (character) => character.codePointAt(0) ?? 0);
  const right = Array.from(b, (character) => character.codePointAt(0) ?? 0);
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return left.length - right.length;
}

/** Premissas: ordem alfabética, em minúsculas, sem acentos e pela ordem Unicode. */
export function compareNames(a: string, b: string): number {
  return compareCodePoints(foldCaseAndAccents(a), foldCaseAndAccents(b));
}

/** Premissas: ordem alfabética, com o empate desfeito pelo id crescente. */
export function compareByNameAndId(
  a: { id: number; name: string },
  b: { id: number; name: string },
): number {
  return compareNames(a.name, b.name) || a.id - b.id;
}

/** RN07: o nome contém o texto buscado, ignorando maiúsculas, minúsculas e acentos. */
export function matchesSearch(name: string, search: string): boolean {
  return foldCaseAndAccents(name).includes(foldCaseAndAccents(search));
}

/** RN10: nome depois da V4 e em minúsculas, mantendo os acentos ("Águias FC" ≠ "Aguias FC"). */
export function normalizeClubName(name: string): string {
  return normalizeSpaces(name).toLowerCase();
}

/**
 * Limites, `acronym`: as letras da sigla aparecem no nome nessa ordem, sem diferenciar maiúsculas,
 * minúsculas e acentos, e a primeira delas é a primeira letra do nome.
 */
export function acronymFitsName(acronym: string, name: string): boolean {
  const nameLetters = Array.from(foldCaseAndAccents(name)).filter((character) =>
    /\p{L}/u.test(character),
  );
  const [first, ...rest] = Array.from(acronym.toLowerCase());
  if (nameLetters[0] !== first) {
    return false;
  }
  let position = 1;
  for (const letter of rest) {
    position = nameLetters.indexOf(letter, position) + 1;
    if (position === 0) {
      return false;
    }
  }
  return true;
}
