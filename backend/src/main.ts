import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enhanced CORS configuration with proper TypeScript handling
  const frontendOrigin = process.env.FRONTEND_ORIGIN;
  const allowedOrigins = frontendOrigin
    ? frontendOrigin.split(',').map((origin: string) => origin.trim())
    : [];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(
    `CORS enabled for origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '*'}`,
  );
}

// Proper Promise handling
void bootstrap();
