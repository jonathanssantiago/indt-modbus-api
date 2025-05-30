import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { DeviceReading } from '../device-readings/entities/device-reading.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceReading]), TerminusModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
