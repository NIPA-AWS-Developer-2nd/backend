import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<string>('NODE_ENV') === 'development',
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl:
      configService.get<string>('NODE_ENV') === 'production'
        ? {
            rejectUnauthorized: false,
          }
        : false,
    extra: {
      connectionLimit: 10,
    },
  };

  console.log('--- Environment Variables Debug ---');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DB_HOST from process.env:', process.env.DB_HOST);
  console.log(
    'DB_HOST from configService:',
    configService.get<string>('DB_HOST'),
  );
  console.log('--- Loaded Database Config ---');
  console.log('Host:', dbConfig.host);
  console.log('Port:', dbConfig.port);
  console.log('Username:', dbConfig.username);
  console.log('Database:', dbConfig.database);
  console.log('Synchronize:', dbConfig.synchronize);
  console.log('-----------------------------');
  // ------------------------------------

  return dbConfig;
};
