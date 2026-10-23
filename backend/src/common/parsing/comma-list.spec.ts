import { isCommaList, isSortList } from './comma-list';

const ACCEPTED = [
  'name',
  'value_asc',
  'value_desc',
  'age_asc',
  'age_desc',
  'position',
];

describe('isSortList (RN07, sort de GET /players)', () => {
  it.each([
    'name',
    'position,value_desc',
    'value_desc,name',
    'age_asc,value_desc',
  ])('aceita %s', (text) => {
    expect(isSortList(text, ACCEPTED, 2)).toBe(true);
  });

  it.each([
    ['vazio', ''],
    ['vírgula no fim', 'name,'],
    ['espaço depois da vírgula', 'name, age_asc'],
    ['caixa trocada', 'POSITION'],
    ['valor fora da lista', 'overall'],
    ['o mesmo campo duas vezes', 'value_asc,value_desc'],
    ['o mesmo critério duas vezes', 'name,name'],
    ['três critérios', 'name,age_asc,position'],
  ])('recusa %s: "%s"', (_, text) => {
    expect(isSortList(text, ACCEPTED, 2)).toBe(false);
  });

  it('com um critério só, recusa o segundo', () => {
    expect(isSortList('name,position', ACCEPTED, 1)).toBe(false);
  });
});

describe('isCommaList (RN17 e RN18, type do histórico)', () => {
  const TYPES = ['COMPRA', 'VENDA'];

  it.each(['COMPRA', 'VENDA', 'COMPRA,VENDA', 'VENDA,COMPRA'])(
    'aceita %s',
    (text) => {
      expect(isCommaList(text, TYPES, TYPES.length)).toBe(true);
    },
  );

  it.each([
    ['vazio', ''],
    ['minúsculas', 'compra'],
    ['caixa trocada em um dos valores', 'COMPRA,venda'],
    ['repetição', 'COMPRA,COMPRA'],
    ['vírgula no fim', 'COMPRA,'],
    ['espaço depois da vírgula', 'COMPRA, VENDA'],
    ['valor fora da lista', 'TROCA'],
  ])('recusa %s: "%s"', (_, text) => {
    expect(isCommaList(text, TYPES, TYPES.length)).toBe(false);
  });
});
