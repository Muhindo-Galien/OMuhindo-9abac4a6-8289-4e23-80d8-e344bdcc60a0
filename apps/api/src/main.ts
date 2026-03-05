import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: ['http://localhost:4200'], // Angular dev server
    credentials: true,
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Simple validation pipe - just for basic DTO validation
  app.useGlobalPipes(new ValidationPipe());

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Secure Task Management API')
    .setDescription('REST API for tasks, organizations, invitations, and audit')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);

  console.log(
    `🚀 Secure Task Management API is running on: http://localhost:${port}/api`
  );
  console.log(
    `📋 Health check available at: http://localhost:${port}/api/health`
  );
  console.log(
    `📖 Swagger docs available at: http://localhost:${port}/api/docs`
  );
}

bootstrap();
