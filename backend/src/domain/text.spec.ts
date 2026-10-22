import {
  acronymFitsName,
  compareByNameAndId,
  compareNames,
  countCharacters,
  countWords,
  hasControlCharacter,
  hasDigit,
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

describe('V4 – caractere é um ponto de código Unicode', () => {
  it('"é" pré-composto conta 1', () => {
    expect(countCharacters('Zé')).toBe(2);
  });

  it('caractere fora do plano básico conta 1, não 2', () => {
    expect(countCharacters('A 𝔸')).toBe(3);
  });

  it('o seletor de variação (U+FE0F) é um ponto de código e conta', () => {
    expect(countCharacters('A❤️')).toBe(3);
  });
});

describe('V4 – palavra é uma sequência sem espaços com pelo menos uma letra', () => {
  it.each([
    ['Meia Lua', 2],
    ['Pelé', 1],
    ['Zé "Foguete" Lima', 3],
    ['F.C. Recife', 2],
    ['Ana-Maria Souza', 2],
    ['Águias Futebol Clube', 3],
  ])('"%s" tem %i palavra(s)', (text, words) => {
    expect(countWords(text)).toBe(words);
  });

  it('pedaço sem letra não conta como palavra: "Ana - Lima" tem 2', () => {
    expect(countWords('Ana - Lima')).toBe(2);
  });

  it('texto vazio tem 0 palavras', () => {
    expect(countWords('')).toBe(0);
  });
});

describe('Limites – dígito vai de 0 a 9', () => {
  it.each(['Meia Lua 2', '0 Lua', 'Lua9'])('"%s" tem dígito', (text) => {
    expect(hasDigit(text)).toBe(true);
  });

  it('algarismo de outra escrita não é dígito de 0 a 9', () => {
    expect(hasDigit('Meia Lua ٣')).toBe(false);
  });

  it('nome sem números não tem dígito', () => {
    expect(hasDigit('Zé "Foguete" Lima')).toBe(false);
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

describe('Limites – sigla: as 3 letras aparecem no nome nessa ordem, a primeira sendo a primeira letra', () => {
  it.each(['AGU', 'AFC', 'ASC'])('%s serve para "Águias FC"', (acronym) => {
    expect(acronymFitsName(acronym, 'Águias FC')).toBe(true);
  });

  it.each([
    ['GFC', 'não começa pela primeira letra do nome'],
    ['ACF', 'as letras estão fora de ordem'],
    ['AGX', 'X não aparece no nome'],
    ['AUU', 'só há um U depois do A'],
  ])('%s não serve para "Águias FC": %s', (acronym) => {
    expect(acronymFitsName(acronym, 'Águias FC')).toBe(false);
  });

  it('compara sem acentos e sem caixa, inclusive a cedilha: "Ação Clube" aceita ACC', () => {
    expect(acronymFitsName('ACC', 'Ação Clube')).toBe(true);
  });

  it('a primeira letra é a primeira da categoria L, depois de pontos e hífens', () => {
    expect(acronymFitsName('FCR', 'F.C. Recife')).toBe(true);
  });
});
