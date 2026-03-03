import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: ['http://localhost:4200'], // Angular dev server
    credentials: true,
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Simple validation pipe - just for basic DTO validation
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(
    `🚀 Secure Task Management API is running on: http://localhost:${port}/api`
  );
  console.log(
    `📋 Health check available at: http://localhost:${port}/api/health`
  );
  console.log(
    `👋 Hello endpoint available at: http://localhost:${port}/api/hello`
  );
}

bootstrap();
