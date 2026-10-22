import { ValuedClub } from '../domain/club-listing';
import { SquadMember } from '../domain/contract';
import { formatBrasiliaDateTime } from '../domain/datetime';
import {
  calculatePenaltyRate,
  calculateRemainingDays,
} from '../domain/loyalty-penalty';
import { toPlayerResponse } from '../players/player.presenter';
import {
  ClubDetailResponseDto,
  ClubPlayerResponseDto,
} from './dto/club-detail-response.dto';
import { ClubResponseDto } from './dto/club-response.dto';

/** Clube das respostas, com o valor do elenco e o patrimônio do momento (RN11). */
export function toClubResponse({ club, worth }: ValuedClub): ClubResponseDto {
  return {
    id: club.id,
    name: club.name,
    acronym: club.acronym,
    cash: club.cash.toNumber(),
    squad_value: worth.squadValue.toNumber(),
    net_worth: worth.netWorth.toNumber(),
  };
}

/**
 * RN11: jogador do elenco com o contrato; dias restantes e percentual de multa calculados para
 * `now` pelas mesmas funções da venda (RN15).
 */
function toSquadMemberResponse(
  { player, contract }: SquadMember,
  now: Date,
): ClubPlayerResponseDto {
  const remainingDays = calculateRemainingDays(contract.loyaltyUntil, now);
  return {
    ...toPlayerResponse(player),
    contract: {
      purchase_value: contract.purchaseValue.toNumber(),
      loyalty_until: formatBrasiliaDateTime(contract.loyaltyUntil),
      remaining_days: remainingDays,
      penalty_rate: calculatePenaltyRate(remainingDays),
    },
  };
}

/** Clube de GET /clubs/{id}, com o elenco na ordem recebida. */
export function toClubDetailResponse(
  club: ValuedClub,
  squad: SquadMember[],
  now: Date,
): ClubDetailResponseDto {
  return {
    ...toClubResponse(club),
    players: squad.map((member) => toSquadMemberResponse(member, now)),
  };
}
