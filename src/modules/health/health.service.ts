import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceReading } from '../device-readings/entities/device-reading.entity';
import { HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(DeviceReading)
    private deviceReadingRepository: Repository<DeviceReading>,
  ) {}

  async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.deviceReadingRepository.query('SELECT 1');
      return {
        database: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          error:
            error instanceof Error ? error.message : 'Database check failed',
        },
      };
    }
  }
}
