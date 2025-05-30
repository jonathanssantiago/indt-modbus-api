import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/typeorm.config';
import { DeviceReadingsModule } from './modules/device-readings/device-readings.module';
import { HealthModule } from './modules/health/health.module';
import { ModbusModule } from './modules/modbus/modbus.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    HealthModule,
    DeviceReadingsModule,
    ModbusModule,
  ],
})
export class AppModule {}
