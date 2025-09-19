import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as cookieParser from 'cookie-parser';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as express from 'express';
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

  // 쿠키 파서 미들웨어
  app.use(cookieParser());

  // 정적 파일 서빙 (개발 환경에서만)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    app.use('/api/docs', express.static(join(__dirname, '..', 'public')));
  }

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
  const corsOrigins = [
    'http://localhost:5173',
    'http://192.168.0.11:5173',
    configService.get<string>('FRONTEND_URL'),
  ].filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // origin이 없는 경우 (같은 도메인 요청) 허용
      if (!origin) return callback(null, true);

      // 개발 환경에서는 모든 IP 주소 허용
      if (configService.get<string>('NODE_ENV') !== 'production') {
        // IP 주소 패턴 매칭 (192.168.x.x:5173 또는 10.x.x.x:5173 등)
        if (
          /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)[\d.]+:5173$/.test(
            origin,
          )
        ) {
          return callback(null, true);
        }
      }

      // 설정된 origin 목록에 있는지 확인
      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
    SwaggerModule.setup('/docs', app, document, {
      swaggerOptions: {
        filter: true,
        persistAuthorization: true,
        defaultModelsExpandDepth: -1,
        displayRequestDuration: true,
        deepLinking: true,
        tagsSorter: 'alpha', // 태그 이름순 정렬
        operationsSorter: 'alpha', // 엔드포인트 이름순 정렬
      },
      customJs: '/docs/swagger-custom.js',
    });
  }

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  const logger = app.get<Logger>(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`🚀 Application is running on port ${port}`);
  if (configService.get<string>('NODE_ENV') !== 'production') {
    logger.log(`📚 Swagger documentation: /docs`);
  }
}

void bootstrap();
