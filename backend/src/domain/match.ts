import { Formation } from './lineup';
import { Duel } from './match-engine';

/** Um dos clubes da partida, com a formação e os gols gravados (RN20). */
export interface MatchSide {
  clubId: number;
  clubName: string;
  formation: Formation;
  goals: number;
}

/** Partida como está gravada: nada é recalculado depois (RN20); o result sai dos gols. */
export interface Match {
  id: number;
  playedAt: Date;
  home: MatchSide;
  away: MatchSide;
}

/** Partida com os 6 duelos, na ordem: os 3 ataques do mandante e depois os 3 do visitante. */
export interface MatchWithDuels extends Match {
  duels: Duel[];
}
