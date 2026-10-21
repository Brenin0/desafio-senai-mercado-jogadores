import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const DOCS_PATH = 'api/docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Passe API')
    .setDescription(
      'Mercado de jogadores de uma liga fictícia: jogadores, clubes, compra e venda, histórico, escalação, partidas e classificação.',
    )
    .setVersion('1.0')
    .build();

  SwaggerModule.setup(DOCS_PATH, app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
