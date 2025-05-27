import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  if (process.env.STAGE === 'dev') {
    app.enableCors();
  }
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });
  app.use(cookieParser());
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
  logger.log(`Environment: ${process.env.STAGE}`);
}
void bootstrap();
