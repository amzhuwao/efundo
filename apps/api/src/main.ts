import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('eFundo API')
    .setDescription('Learning platform API for resources, lessons, and assessments')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT ?? 3001;
  const webUrl = (process.env.WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  // Browsers sometimes hit the API host for app routes (e.g. :3001/login).
  const http = app.getHttpAdapter().getInstance();
  for (const path of ['/', '/login', '/register', '/dashboard', '/admin']) {
    http.get(path, (_req: unknown, res: { redirect: (url: string) => void }) => {
      res.redirect(`${webUrl}${path === '/' ? '' : path}`);
    });
  }

  await app.listen(port);
  console.log(`eFundo API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
