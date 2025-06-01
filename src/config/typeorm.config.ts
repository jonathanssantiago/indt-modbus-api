import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

const configService = new ConfigService();

// Configuração base
const baseOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'modbus_db'),
  entities: [join(__dirname, '..', '**', 'entities', '*.entity.{ts,js}')],
  synchronize: false,
  logging: configService.get('NODE_ENV', 'development') === 'development',
};

// Configuração para CLI (migrações)
export const dataSourceOptions: DataSourceOptions = {
  ...baseOptions,
  migrations: [
    join(
      process.env.NODE_ENV === 'production' ? 'dist' : 'src',
      'database',
      'migrations',
      process.env.NODE_ENV === 'production' ? '*.js' : '*.ts',
    ),
  ],
};

// Configuração para aplicação NestJS (sem migrações)
export const appDataSourceOptions: DataSourceOptions = {
  ...baseOptions,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
