import { applyDecorators, BadRequestException, Type } from '@nestjs/common';
import { IsOptional } from 'class-validator';
import Decimal from 'decimal.js';
import { createValidationPipe } from '../pipes/validation.pipe';
import { IsBrasiliaDateTime } from './datetime.validators';
import {
  IsNotGreaterThan,
  IsNotTrueWith,
  IsQueryBoolean,
  IsQueryDecimal,
  IsQueryInteger,
  IsQueryList,
  IsQuerySort,
} from './query.validators';
import {
  HasNoDigits,
  HasWordCountBetween,
  IsNormalizedText,
} from './text.validators';
import {
  IsDifferentFrom,
  IsDistinctIdList,
  IsIntegerBetween,
  IsOneOf,
  IsRequired,
} from './value.validators';

type Outcome<T> = { accepted: T } | { refused: string };

/** Passa o valor pelo ValidationPipe da aplicação, como o corpo ou a query de uma requisição. */
async function validate<T>(
  metatype: Type<T>,
  value: object,
  type: 'body' | 'query' = 'body',
): Promise<Outcome<T>> {
  try {
    const accepted = (await createValidationPipe().transform(value, {
      type,
      metatype,
    })) as T;
    return { accepted };
  } catch (error) {
    if (error instanceof BadRequestException) {
      return { refused: error.message };
    }
    throw error;
  }
}

/** As regras do campo, juntadas na ordem em que são conferidas. */
function IsPersonName(): PropertyDecorator {
  return applyDecorators(
    IsRequired(),
    IsNormalizedText(3, 100),
    HasWordCountBetween(2),
    HasNoDigits(),
  );
}

class PersonNameDto {
  @IsPersonName()
  name!: string;
}

class ShortNameDto {
  @applyDecorators(IsNormalizedText(3, 10), HasWordCountBetween(2, 3))
  name!: string;
}

class AttributesDto {
  @IsRequired()
  @IsIntegerBetween(1, 99)
  pace!: number;

  @IsRequired()
  @IsOneOf(['GOL', 'ATA'])
  position!: string;
}

class FiltersDto {
  @IsOptional()
  @IsNormalizedText(2, 100)
  search?: string;

  @IsOptional()
  @IsQueryInteger()
  page: number = 1;

  @IsOptional()
  @IsQueryInteger(16, 45)
  @IsNotGreaterThan('max_age')
  min_age?: number;

  @IsOptional()
  @IsQueryInteger(16, 45)
  max_age?: number;

  @IsOptional()
  @IsQueryBoolean()
  @IsNotTrueWith('club_id')
  free?: boolean;

  @IsOptional()
  @IsQueryInteger()
  club_id?: number;

  @IsOptional()
  @IsQueryDecimal(0, 550)
  @IsNotGreaterThan('max_value')
  min_value?: Decimal;

  @IsOptional()
  @IsQueryDecimal(0, 550)
  max_value?: Decimal;

  @IsOptional()
  @IsQuerySort(['name', 'value_asc', 'value_desc'], 2)
  sort: string = 'name';
}

class PurchaseDto {
  @IsRequired()
  @IsBrasiliaDateTime()
  loyalty_until!: Date;
}

class HistoryFiltersDto {
  @IsOptional()
  @IsQueryList(['COMPRA', 'VENDA'])
  type?: string;
}

class LineupDto {
  @IsRequired()
  @IsDistinctIdList(5)
  player_ids!: number[];
}

class MatchDto {
  @IsRequired()
  @IsIntegerBetween(1)
  home_club_id!: number;

  @IsRequired()
  @applyDecorators(IsIntegerBetween(1), IsDifferentFrom('home_club_id'))
  away_club_id!: number;
}

describe('IsNormalizedText, HasWordCountBetween e HasNoDigits (V4 e Limites)', () => {
  it('V4: grava o nome com os espaços das pontas removidos e os repetidos juntados', async () => {
    await expect(
      validate(PersonNameDto, { name: '  Meia   Zeta ' }),
    ).resolves.toEqual({ accepted: { name: 'Meia Zeta' } });
  });

  it.each([
    ['3 caracteres e 2 palavras', 'A B'],
    ['100 caracteres', `Ana ${'b'.repeat(96)}`],
    ['aspas e ponto e vírgula', 'Zé "Foguete" Lima;'],
    ['"é" pré-composto contado como 1 caractere', 'Zé é'],
  ])('aceita %s', async (_, name) => {
    await expect(validate(PersonNameDto, { name })).resolves.toEqual({
      accepted: { name },
    });
  });

  it.each([
    ['2 caracteres', 'AB', 'name deve ter de 3 a 100 caracteres'],
    [
      '101 caracteres',
      `Ana ${'b'.repeat(97)}`,
      'name deve ter de 3 a 100 caracteres',
    ],
    ['1 palavra', 'Pelé', 'name deve ter pelo menos 2 palavras'],
    ['dígito', 'Meia Lua 2', 'name não pode ter dígitos'],
    [
      'tabulação',
      'Meia\tLua',
      'name não pode ter caracteres de controle, como tabulação ou quebra de linha',
    ],
    [
      'quebra de linha',
      'Meia\nLua',
      'name não pode ter caracteres de controle, como tabulação ou quebra de linha',
    ],
    ['texto que fica vazio depois da V4', '    ', 'name não pode ser vazio'],
  ])('recusa %s', async (_, name, message) => {
    await expect(validate(PersonNameDto, { name })).resolves.toEqual({
      refused: message,
    });
  });

  it.each([
    ['ausente', {}, 'name é obrigatório'],
    ['nulo', { name: null }, 'name é obrigatório'],
    ['número', { name: 123 }, 'name deve ser um texto'],
  ])(
    'V2 e V6: recusa name %s com a mensagem certa',
    async (_, body, message) => {
      await expect(validate(PersonNameDto, body)).resolves.toEqual({
        refused: message,
      });
    },
  );

  it('o tamanho é conferido depois da V4: " Ana  Lima Souza " tem 15 caracteres', async () => {
    await expect(
      validate(ShortNameDto, { name: ' Ana  Lima Souza ' }),
    ).resolves.toEqual({ refused: 'name deve ter de 3 a 10 caracteres' });
  });

  it('recusa palavras acima do máximo', async () => {
    await expect(validate(ShortNameDto, { name: 'A B C D' })).resolves.toEqual({
      refused: 'name deve ter de 2 a 3 palavras',
    });
  });
});

describe('IsIntegerBetween, IsOneOf e IsRequired (V2, V5, V6)', () => {
  it('aceita os limites, inclusivos, e 50.0 como o inteiro 50', async () => {
    await expect(
      validate(AttributesDto, { pace: 1, position: 'GOL' }),
    ).resolves.toEqual({ accepted: { pace: 1, position: 'GOL' } });
    await expect(
      validate(AttributesDto, { pace: 99, position: 'ATA' }),
    ).resolves.toEqual({ accepted: { pace: 99, position: 'ATA' } });
    await expect(
      validate(
        AttributesDto,
        JSON.parse('{"pace": 50.0, "position": "ATA"}') as object,
      ),
    ).resolves.toEqual({ accepted: { pace: 50, position: 'ATA' } });
  });

  it.each([
    ['0, abaixo do limite', 0],
    ['100, acima do limite', 100],
    ['texto "15"', '15'],
    ['50.5, com parte fracionária', 50.5],
    ['booleano', true],
  ])('recusa %s', async (_, pace) => {
    await expect(
      validate(AttributesDto, { pace, position: 'GOL' }),
    ).resolves.toEqual({
      refused: 'pace deve ser um número inteiro de 1 a 99',
    });
  });

  it.each(['ata', 'Ata', 'MEI'])(
    'V5: recusa a posição %s',
    async (position) => {
      await expect(
        validate(AttributesDto, { pace: 50, position }),
      ).resolves.toEqual({
        refused: 'position deve ser um destes valores: GOL, ATA',
      });
    },
  );

  it('V7: ignora campos que o DTO não conhece', async () => {
    await expect(
      validate(AttributesDto, {
        pace: 50,
        position: 'GOL',
        overall: 99,
        Pace: 1,
      }),
    ).resolves.toEqual({ accepted: { pace: 50, position: 'GOL' } });
  });

  it('junta as mensagens de campos diferentes, uma por campo', async () => {
    await expect(validate(AttributesDto, {})).resolves.toEqual({
      refused: 'pace é obrigatório; position é obrigatório',
    });
  });
});

describe('Validadores de query (Filtros e query params)', () => {
  it('usa os padrões quando o parâmetro não vem', async () => {
    await expect(validate(FiltersDto, {}, 'query')).resolves.toEqual({
      accepted: { page: 1, sort: 'name' },
    });
  });

  it('converte os textos aceitos para o tipo do parâmetro', async () => {
    const outcome = await validate(
      FiltersDto,
      {
        page: '2',
        min_age: '20',
        max_age: '20',
        free: 'false',
        min_value: '0.5',
        max_value: '10.50',
        sort: 'value_desc,name',
      },
      'query',
    );

    expect(outcome).toEqual({
      accepted: {
        page: 2,
        min_age: 20,
        max_age: 20,
        free: false,
        min_value: new Decimal('0.5'),
        max_value: new Decimal('10.5'),
        sort: 'value_desc,name',
      },
    });
  });

  it('V4: normaliza os espaços do search', async () => {
    await expect(
      validate(FiltersDto, { search: '  meia   lua ' }, 'query'),
    ).resolves.toEqual({
      accepted: { search: 'meia lua', page: 1, sort: 'name' },
    });
  });

  it.each([
    ['search', ''],
    ['search', '   '],
    ['search', 'a'],
    ['search', 'lu	a'],
    ['search', 'a'.repeat(101)],
    ['page', '0'],
    ['page', '01'],
    ['page', '1.0'],
    ['page', '+1'],
    ['page', '1e1'],
    ['page', ''],
    ['page', '2147483648'],
    ['min_age', '15'],
    ['max_age', '46'],
    ['free', 'TRUE'],
    ['free', '1'],
    ['free', ''],
    ['min_value', '-1'],
    ['min_value', '00.5'],
    ['min_value', '.5'],
    ['min_value', '10,5'],
    ['min_value', '10.555'],
    ['min_value', '1e2'],
    ['max_value', '550.01'],
    ['sort', 'name,'],
    ['sort', 'value_asc,value_desc'],
    ['sort', ''],
  ])('recusa %s=%s', async (name, value) => {
    await expect(
      validate(FiltersDto, { [name]: value }, 'query'),
    ).resolves.toHaveProperty('refused');
  });

  it.each(['page', 'free', 'min_value', 'sort'])(
    'D14: recusa %s repetido, que chega como lista',
    async (name) => {
      await expect(
        validate(FiltersDto, { [name]: ['1', '2'] }, 'query'),
      ).resolves.toHaveProperty('refused');
    },
  );

  it('aceita os extremos da faixa de valor', async () => {
    await expect(
      validate(FiltersDto, { min_value: '0', max_value: '550' }, 'query'),
    ).resolves.toHaveProperty('accepted');
  });

  it.each([
    [
      { min_age: '30', max_age: '20' },
      'min_age não pode ser maior que max_age',
    ],
    [
      { min_value: '20', max_value: '10' },
      'min_value não pode ser maior que max_value',
    ],
  ])('recusa a faixa contraditória %p', async (query, message) => {
    await expect(validate(FiltersDto, query, 'query')).resolves.toEqual({
      refused: message,
    });
  });

  it('recusa a combinação contraditória free=true com club_id', async () => {
    await expect(
      validate(FiltersDto, { free: 'true', club_id: '1' }, 'query'),
    ).resolves.toEqual({
      refused: 'free=true não pode vir junto com club_id',
    });
  });

  it('aceita free=false com club_id', async () => {
    await expect(
      validate(FiltersDto, { free: 'false', club_id: '1' }, 'query'),
    ).resolves.toEqual({
      accepted: { free: false, club_id: 1, page: 1, sort: 'name' },
    });
  });

  it('só compara a faixa quando os dois limites são válidos', async () => {
    await expect(
      validate(FiltersDto, { min_age: '30', max_age: 'abc' }, 'query'),
    ).resolves.toEqual({
      refused: 'max_age deve ser um número inteiro de 16 a 45',
    });
  });
});

describe('IsBrasiliaDateTime (RN01)', () => {
  it('converte AAAA-MM-DDTHH:MM-03:00 para o instante certo, sem depender do fuso da máquina', async () => {
    await expect(
      validate(PurchaseDto, { loyalty_until: '2027-03-02T10:15-03:00' }),
    ).resolves.toEqual({
      accepted: { loyalty_until: new Date('2027-03-02T13:15:00Z') },
    });
  });

  it.each(['2028-02-29T10:00-03:00', '2027-03-02T00:00-03:00'])(
    'aceita %s (29 de fevereiro de ano bissexto e meia-noite)',
    async (loyaltyUntil) => {
      await expect(
        validate(PurchaseDto, { loyalty_until: loyaltyUntil }),
      ).resolves.toHaveProperty('accepted');
    },
  );

  it.each([
    ['sem o fuso', '2027-03-02T10:15'],
    ['com Z', '2027-03-02T10:15Z'],
    ['com +00:00', '2027-03-02T10:15+00:00'],
    ['com -02:00', '2027-03-02T10:15-02:00'],
    ['com -0300', '2027-03-02T10:15-0300'],
    ['com segundos (formato de saída)', '2027-03-02T10:15:00-03:00'],
    ['com espaço no lugar do T', '2027-03-02 10:15-03:00'],
    ['com t minúsculo', '2027-03-02t10:15-03:00'],
    ['sem os zeros à esquerda', '2027-3-2T10:15-03:00'],
    ['30 de fevereiro', '2027-02-30T10:15-03:00'],
    ['29 de fevereiro de 2027, que não é bissexto', '2027-02-29T10:15-03:00'],
    ['24:00', '2027-03-02T24:00-03:00'],
    ['23:60', '2027-03-02T23:60-03:00'],
    ['mês 13', '2027-13-02T10:15-03:00'],
    ['dia 00', '2027-03-00T10:15-03:00'],
    ['número', 20270302],
    ['texto vazio', ''],
  ])('recusa data %s', async (_, loyaltyUntil) => {
    await expect(
      validate(PurchaseDto, { loyalty_until: loyaltyUntil }),
    ).resolves.toEqual({
      refused:
        'loyalty_until deve ser uma data e hora que exista, no formato AAAA-MM-DDTHH:MM-03:00 (ex.: 2027-03-02T10:15-03:00)',
    });
  });

  it.each([
    ['ausente', {}],
    ['nula', { loyalty_until: null }],
  ])('V6: recusa data %s', async (_, body) => {
    await expect(validate(PurchaseDto, body)).resolves.toEqual({
      refused: 'loyalty_until é obrigatório',
    });
  });
});

describe('IsQueryList (RN17, type do histórico)', () => {
  it.each(['COMPRA', 'VENDA', 'COMPRA,VENDA', 'VENDA,COMPRA'])(
    'aceita type=%s',
    async (type) => {
      await expect(
        validate(HistoryFiltersDto, { type }, 'query'),
      ).resolves.toEqual({ accepted: { type } });
    },
  );

  it.each([
    'compra',
    'COMPRA,venda',
    'COMPRA,COMPRA',
    'COMPRA,',
    'COMPRA, VENDA',
    '',
  ])('recusa type=%s', async (type) => {
    await expect(
      validate(HistoryFiltersDto, { type }, 'query'),
    ).resolves.toHaveProperty('refused');
  });

  it('D14: recusa type repetido, que chega como lista', async () => {
    await expect(
      validate(HistoryFiltersDto, { type: ['COMPRA', 'VENDA'] }, 'query'),
    ).resolves.toHaveProperty('refused');
  });
});

describe('IsDistinctIdList (RN19, player_ids da escalação)', () => {
  it('aceita 5 ids distintos, inteiros positivos, em qualquer ordem', async () => {
    await expect(
      validate(LineupDto, { player_ids: [34, 31, 30, 33, 32] }),
    ).resolves.toEqual({ accepted: { player_ids: [34, 31, 30, 33, 32] } });
  });

  it('V2: aceita 30.0 como o inteiro 30', async () => {
    await expect(
      validate(
        LineupDto,
        JSON.parse('{"player_ids": [34, 31, 30.0, 33, 32]}') as object,
      ),
    ).resolves.toEqual({ accepted: { player_ids: [34, 31, 30, 33, 32] } });
  });

  it.each([
    ['texto', '34,31,30,33,32', 'player_ids deve ser uma lista'],
    ['número', 34, 'player_ids deve ser uma lista'],
    ['objeto', { 0: 34 }, 'player_ids deve ser uma lista'],
    ['lista vazia', [], 'player_ids deve ter exatamente 5 ids'],
    ['4 ids', [34, 31, 30, 33], 'player_ids deve ter exatamente 5 ids'],
    ['6 ids', [34, 31, 30, 33, 32, 35], 'player_ids deve ter exatamente 5 ids'],
    [
      'id em texto',
      [34, 31, '30', 33, 32],
      'player_ids deve ter só números inteiros maiores ou iguais a 1',
    ],
    [
      'id com parte fracionária',
      [34, 31, 1.5, 33, 32],
      'player_ids deve ter só números inteiros maiores ou iguais a 1',
    ],
    [
      'id 0',
      [34, 31, 0, 33, 32],
      'player_ids deve ter só números inteiros maiores ou iguais a 1',
    ],
    [
      'id negativo',
      [34, 31, -1, 33, 32],
      'player_ids deve ter só números inteiros maiores ou iguais a 1',
    ],
    [
      'id nulo',
      [34, 31, null, 33, 32],
      'player_ids deve ter só números inteiros maiores ou iguais a 1',
    ],
    [
      'id acima de 2.147.483.647',
      [34, 31, 2147483648, 33, 32],
      'player_ids deve ter só números inteiros maiores ou iguais a 1',
    ],
    [
      'id repetido',
      [34, 31, 34, 33, 32],
      'player_ids não pode ter ids repetidos',
    ],
  ])('recusa %s', async (_, player_ids, message) => {
    await expect(validate(LineupDto, { player_ids })).resolves.toEqual({
      refused: message,
    });
  });

  it.each([
    ['ausente', {}],
    ['nulo', { player_ids: null }],
  ])('V6: recusa player_ids %s', async (_, body) => {
    await expect(validate(LineupDto, body)).resolves.toEqual({
      refused: 'player_ids é obrigatório',
    });
  });
});

describe('IsDifferentFrom (RN20, mandante e visitante)', () => {
  it('aceita clubes diferentes', async () => {
    await expect(
      validate(MatchDto, { home_club_id: 1, away_club_id: 2 }),
    ).resolves.toEqual({ accepted: { home_club_id: 1, away_club_id: 2 } });
  });

  it('recusa o mandante igual ao visitante', async () => {
    await expect(
      validate(MatchDto, { home_club_id: 1, away_club_id: 1 }),
    ).resolves.toEqual({
      refused: 'away_club_id deve ser diferente de home_club_id',
    });
  });

  it('V2: 1.0 é o mesmo clube que 1', async () => {
    await expect(
      validate(
        MatchDto,
        JSON.parse('{"home_club_id": 1, "away_club_id": 1.0}') as object,
      ),
    ).resolves.toEqual({
      refused: 'away_club_id deve ser diferente de home_club_id',
    });
  });

  it('confere o formato antes da diferença: dois 0 são recusados pelo formato', async () => {
    await expect(
      validate(MatchDto, { home_club_id: 0, away_club_id: 0 }),
    ).resolves.toEqual({
      refused:
        'home_club_id deve ser um número inteiro maior ou igual a 1; away_club_id deve ser um número inteiro maior ou igual a 1',
    });
  });

  it('texto "1" no visitante é recusado pelo formato, não pela diferença', async () => {
    await expect(
      validate(MatchDto, { home_club_id: 2, away_club_id: '1' }),
    ).resolves.toEqual({
      refused: 'away_club_id deve ser um número inteiro maior ou igual a 1',
    });
  });

  it('V6: recusa o visitante ausente', async () => {
    await expect(validate(MatchDto, { home_club_id: 1 })).resolves.toEqual({
      refused: 'away_club_id é obrigatório',
    });
  });
});
