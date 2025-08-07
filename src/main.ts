import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as cookieParser from 'cookie-parser';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

interface PackageJson {
  version: string;
  name: string;
}

function isPackageJson(obj: unknown): obj is PackageJson {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as PackageJson).version === 'string' &&
    typeof (obj as PackageJson).name === 'string'
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // package.json 버전 정보
  const packageJsonData: unknown = JSON.parse(
    readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
  );

  if (!isPackageJson(packageJsonData)) {
    throw new Error('Invalid package.json structure');
  }

  const packageJson: PackageJson = packageJsonData;

  // Winston Logger 설정
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 글로벌 예외 필터 설정
  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(WINSTON_MODULE_NEST_PROVIDER)),
  );

  // 글로벌 API 접두사 설정
  app.setGlobalPrefix('api');

  // 쿠키 파서 미들웨어
  app.use(cookieParser());

  // Validation Pipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages:
        configService.get<string>('NODE_ENV') === 'production',
    }),
  );

  // CORS 설정
  app.enableCors({
    origin:
      configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
  });

  // Swagger 설정
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Halsaram API')
      .setVersion(packageJson.version)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        filter: true,
        persistAuthorization: true,
        defaultModelsExpandDepth: -1,
        displayRequestDuration: true,
        deepLinking: true,
      },
    });
  }

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  const logger = app.get<Logger>(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`🚀 Application running on: http://localhost:${port}`);
  if (configService.get<string>('NODE_ENV') !== 'production') {
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
