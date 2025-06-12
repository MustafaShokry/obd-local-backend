import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  if (process.env.STAGE === 'dev') {
    // TODO: change to the actual IP and port in production
    app.enableCors({
      origin: 'http://localhost:5173',
      credentials: true,
    });
  }
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
  logger.log(`Environment: ${process.env.STAGE}`);
}
void bootstrap();
