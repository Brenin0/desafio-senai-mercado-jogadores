import Decimal from 'decimal.js';
import { Transaction } from '../domain/transaction';
import { toTransactionsCsv } from './transactions-csv';

const HEADER =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 10,
    clubId: 1,
    playerId: 2,
    playerName: 'Meia Lua',
    type: 'COMPRA',
    value: new Decimal('37.00'),
    fee: new Decimal('1.85'),
    penalty: new Decimal('0.00'),
    profit: null,
    cashChange: new Decimal('-38.85'),
    createdAt: new Date('2026-11-02T13:15:00Z'),
    ...overrides,
  };
}

const MEIA_LUA_SALE = transaction({
  id: 11,
  type: 'VENDA',
  value: new Decimal('40.00'),
  fee: new Decimal('0.30'),
  penalty: new Decimal('4.00'),
  profit: new Decimal('3.00'),
  cashChange: new Decimal('35.70'),
  createdAt: new Date('2026-11-05T19:40:00Z'),
});

describe('RN18 – exportação do histórico em CSV', () => {
  it('o exemplo do enunciado: cabeçalho, a venda e a compra do Meia Lua, nessa ordem, cada linha com \\n', () => {
    expect(toTransactionsCsv([MEIA_LUA_SALE, transaction()])).toBe(
      `${HEADER}\n` +
        '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n' +
        '2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n',
    );
  });

  it('sem transações: só a linha de cabeçalho, também terminada em \\n', () => {
    expect(toTransactionsCsv([])).toBe(`${HEADER}\n`);
  });

  it('nome com aspas vai entre aspas duplas, com cada aspa interna duplicada', () => {
    const csv = toTransactionsCsv([
      transaction({ playerName: 'Zé "Foguete" Lima' }),
    ]);

    expect(csv.split('\n')[1]).toBe(
      '2026-11-02T10:15:00-03:00;COMPRA;"Zé ""Foguete"" Lima";37,00;1,85;0,00;;-38,85',
    );
  });

  it('nome com ponto e vírgula vai entre aspas duplas', () => {
    const csv = toTransactionsCsv([
      transaction({ playerName: 'Ana;Lima Souza' }),
    ]);

    expect(csv.split('\n')[1]).toContain(';"Ana;Lima Souza";');
  });

  it('nome sem ponto e vírgula nem aspas vai sem aspas, como foi gravado', () => {
    const csv = toTransactionsCsv([
      transaction({ playerName: 'Zé Ana-Maria Jr.' }),
    ]);

    expect(csv.split('\n')[1]).toContain(';Zé Ana-Maria Jr.;');
  });

  it('prejuízo com sinal negativo e lucro zero como 0,00', () => {
    const csv = toTransactionsCsv([
      transaction({
        type: 'VENDA',
        profit: new Decimal('-7.50'),
        cashChange: new Decimal('34.00'),
      }),
      transaction({
        type: 'VENDA',
        profit: new Decimal('0.00'),
        cashChange: new Decimal('25.00'),
      }),
    ]);

    const [, loss, even] = csv.split('\n');
    expect(loss.split(';')[6]).toBe('-7,50');
    expect(even.split(';')[6]).toBe('0,00');
  });

  it('UTF-8 sem BOM e só LF: nenhum \\r e nenhum U+FEFF', () => {
    const csv = toTransactionsCsv([MEIA_LUA_SALE]);

    expect(csv.startsWith('﻿')).toBe(false);
    expect(csv).not.toContain('\r');
  });
});
