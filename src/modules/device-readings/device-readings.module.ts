import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReadingsController } from './device-readings.controller';
import { DeviceReadingsService } from './device-readings.service';
import { DeviceReading } from './entities/device-reading.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceReading])],
  controllers: [DeviceReadingsController],
  providers: [DeviceReadingsService],
})
export class DeviceReadingsModule {} 