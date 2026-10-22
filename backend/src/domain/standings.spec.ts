import { calculateStandings, PlayedMatch, StandingRow } from './standings';

const clubs = [
  { id: 1, name: 'Águias FC' },
  { id: 2, name: 'Delta FC' },
  { id: 3, name: 'Gama SC' },
  { id: 4, name: 'Épsilon EC' },
  { id: 5, name: 'Tubarões EC' },
  { id: 6, name: 'Mangue FC' },
];

// prettier-ignore
const matches: PlayedMatch[] = [
  { homeClubId: 1, awayClubId: 2, homeGoals: 1, awayGoals: 2 }, // Águias FC 1 × 2 Delta FC
  { homeClubId: 3, awayClubId: 4, homeGoals: 2, awayGoals: 1 }, // Gama SC 2 × 1 Épsilon EC
  { homeClubId: 4, awayClubId: 1, homeGoals: 3, awayGoals: 2 }, // Épsilon EC 3 × 2 Águias FC
  { homeClubId: 2, awayClubId: 3, homeGoals: 0, awayGoals: 1 }, // Delta FC 0 × 1 Gama SC
];

describe('RN21 – classificação de exemplo: 6 clubes e 4 partidas', () => {
  // prettier-ignore
  it.each<[number, string, number, number, number, number, number, number, number, number]>([
    // posição, clube, jogos, vitórias, empates, derrotas, gols marcados, gols sofridos, saldo, pontos
    [1, 'Gama SC', 2, 2, 0, 0, 3, 1, 2, 6],
    [2, 'Épsilon EC', 2, 1, 0, 1, 4, 4, 0, 3],
    [3, 'Delta FC', 2, 1, 0, 1, 2, 2, 0, 3],
    [4, 'Mangue FC', 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 'Tubarões EC', 0, 0, 0, 0, 0, 0, 0, 0],
    [6, 'Águias FC', 2, 0, 0, 2, 3, 5, -2, 0],
  ])(
    '%iº lugar: %s',
    (position, clubName, played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference, points) => {
      const row = calculateStandings(clubs, matches)[position - 1];
      expect(row).toEqual<StandingRow>({
        position,
        clubId: clubs.find((club) => club.name === clubName)?.id ?? 0,
        clubName,
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points,
      });
    },
  );

  it('traz todos os clubes, inclusive os que ainda não jogaram, com posições de 1 a 6', () => {
    const standings = calculateStandings(clubs, matches);
    expect(standings.map((row) => row.position)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('RN21 – pontos: vitória 3, empate 1, derrota 0', () => {
  it('1 × 1 dá 1 ponto e 1 empate para cada clube', () => {
    const standings = calculateStandings(
      [
        { id: 1, name: 'Alfa FC' },
        { id: 2, name: 'Beta FC' },
      ],
      [{ homeClubId: 1, awayClubId: 2, homeGoals: 1, awayGoals: 1 }],
    );
    expect(
      standings.map((row) => [row.clubName, row.draws, row.points]),
    ).toEqual([
      ['Alfa FC', 1, 1],
      ['Beta FC', 1, 1],
    ]);
  });
});
