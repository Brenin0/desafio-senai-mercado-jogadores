/** Linha de GET /standings (2.4.3): calculada a cada consulta, nunca gravada (RN21). */
export class StandingResponseDto {
  /** De 1 ao total de clubes, sem repetir. */
  position!: number;
  club_id!: number;
  club_name!: string;
  played!: number;
  wins!: number;
  draws!: number;
  losses!: number;
  goals_for!: number;
  goals_against!: number;
  goal_difference!: number;
  /** Vitória vale 3, empate 1 e derrota 0. */
  points!: number;
}
