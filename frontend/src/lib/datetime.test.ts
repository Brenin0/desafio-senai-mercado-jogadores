import { describe, expect, it } from 'vitest';
import { toApiDateTime } from './datetime.ts';

describe('toApiDateTime (RN01)', () => {
  it('envia a data e a hora digitadas como horário de Brasília, com -03:00', () => {
    expect(toApiDateTime('2027-03-02T10:15')).toBe('2027-03-02T10:15-03:00');
  });

  it('descarta os segundos, que o formato da RN01 não aceita', () => {
    expect(toApiDateTime('2027-03-02T10:15:30')).toBe('2027-03-02T10:15-03:00');
  });
});
