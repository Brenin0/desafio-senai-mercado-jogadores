/** Relógio dos testes: começa num instante e só muda quando o teste manda (RN01, RN15). */
export class TestClock {
  private current: Date;

  constructor(start: Date) {
    this.current = new Date(start);
  }

  now(): Date {
    return new Date(this.current);
  }

  set(instant: Date): void {
    this.current = new Date(instant);
  }
}
