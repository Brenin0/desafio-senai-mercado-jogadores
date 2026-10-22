/** V4: tira os espaços (U+0020) das pontas e junta os repetidos num só. */
export function normalizeSpaces(text: string): string {
  return text.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ');
}

/** V4: caracteres de controle (categoria Unicode Cc), como tabulação e quebra de linha. */
export function hasControlCharacter(text: string): boolean {
  return /\p{Cc}/u.test(text);
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
