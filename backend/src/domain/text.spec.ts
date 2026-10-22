import {
  compareByNameAndId,
  compareNames,
  hasControlCharacter,
  matchesSearch,
  normalizeClubName,
  normalizeSpaces,
} from './text';

describe('V4 – espaços: remove os das pontas e junta os repetidos', () => {
  it('"  Meia   Zeta " → "Meia Zeta"', () => {
    expect(normalizeSpaces('  Meia   Zeta ')).toBe('Meia Zeta');
  });

  it('só o U+0020 é espaço: o espaço não separável (U+00A0) fica como está', () => {
    expect(normalizeSpaces(' Meia Lua')).toBe(' Meia Lua');
  });
});

describe('V4 – caracteres de controle', () => {
  it.each([
    ['tabulação', 'Meia\tLua'],
    ['quebra de linha', 'Meia\nLua'],
  ])('%s é caractere de controle', (_, text) => {
    expect(hasControlCharacter(text)).toBe(true);
  });

  it('nome com acentos, hífen e ponto não tem caractere de controle', () => {
    expect(hasControlCharacter('Zé Ana-Maria Jr.')).toBe(false);
  });
});

describe('Premissas – ordem alfabética: minúsculas, sem acentos, pela ordem Unicode', () => {
  it('"Épsilon" fica entre "Delta" e "Gama"', () => {
    expect(['Gama', 'Épsilon', 'Delta'].sort(compareNames)).toEqual([
      'Delta',
      'Épsilon',
      'Gama',
    ]);
  });

  it('"Ana Lima" vem antes de "Ana-Maria" (o espaço vem antes do hífen)', () => {
    expect(['Ana-Maria', 'Ana Lima'].sort(compareNames)).toEqual([
      'Ana Lima',
      'Ana-Maria',
    ]);
  });

  it('o hífen vem antes das letras', () => {
    expect(['Ana Maria', 'Ana-Maria'].sort(compareNames)).toEqual([
      'Ana Maria',
      'Ana-Maria',
    ]);
    expect(['Anabela', 'Ana-Maria'].sort(compareNames)).toEqual([
      'Ana-Maria',
      'Anabela',
    ]);
  });

  it('maiúsculas não mudam a ordem: "alfa" vem antes de "Zeta"', () => {
    expect(['Zeta', 'alfa'].sort(compareNames)).toEqual(['alfa', 'Zeta']);
  });

  it('"Águias FC" e "Aguias FC" empatam no nome', () => {
    expect(compareNames('Águias FC', 'Aguias FC')).toBe(0);
  });

  it('o empate no nome é desfeito pelo id crescente', () => {
    const clubs = [
      { id: 2, name: 'Águias FC' },
      { id: 1, name: 'Aguias FC' },
      { id: 3, name: 'Delta FC' },
    ];
    expect(clubs.sort(compareByNameAndId).map((club) => club.id)).toEqual([
      1, 2, 3,
    ]);
  });

  it('compara por ponto de código: "Ａ" (U+FF21) vem antes de "𝐀" (U+1D400)', () => {
    expect(['a\u{1D400}', 'aＡ'].sort(compareNames)).toEqual([
      'aＡ',
      'a\u{1D400}',
    ]);
  });
});

describe('RN07 – busca: contém, ignorando maiúsculas, minúsculas e acentos', () => {
  it.each([
    ['joao', 'João Silva', true],
    ['LUA', 'Meia Lua', true],
    ['conceicao', 'Ana Conceição', true],
    ['JOÃO', 'Joao Silva', true],
    ['zeta', 'Meia Lua', false],
  ])('"%s" em "%s" → %s', (search, name, expected) => {
    expect(matchesSearch(name, search)).toBe(expected);
  });
});

describe('RN10 – nome normalizado do clube: V4 e minúsculas, mantendo os acentos', () => {
  it.each([
    ['Águias FC', 'águias fc'],
    ['  águias   fc ', 'águias fc'],
    ['Aguias FC', 'aguias fc'],
  ])('"%s" → "%s"', (name, expected) => {
    expect(normalizeClubName(name)).toBe(expected);
  });
});
