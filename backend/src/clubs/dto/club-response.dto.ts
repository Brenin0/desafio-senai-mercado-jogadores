/** Campos mínimos de cada clube (2.2): valor do elenco e patrimônio calculados a cada consulta (RN11). */
export class ClubResponseDto {
  id!: number;
  name!: string;
  acronym!: string;
  cash!: number;
  squad_value!: number;
  net_worth!: number;
}
