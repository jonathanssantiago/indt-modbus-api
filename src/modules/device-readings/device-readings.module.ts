import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReadingsController } from './device-readings.controller';
import { DeviceReadingsService } from './device-readings.service';
import { DeviceReading } from './entities/device-reading.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceReading]), ConfigModule],
  controllers: [DeviceReadingsController],
  providers: [DeviceReadingsService],
  exports: [DeviceReadingsService],
})
export class DeviceReadingsModule {}
