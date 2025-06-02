import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceReading } from '../device-readings/entities/device-reading.entity';
import { DeviceReadingsService } from '../device-readings/device-readings.service';
import { HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(DeviceReading)
    private deviceReadingRepository: Repository<DeviceReading>,
    private deviceReadingsService: DeviceReadingsService,
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

  async checkModbus(): Promise<HealthIndicatorResult> {
    try {
      const modbusStatus =
        await this.deviceReadingsService.statusModbusService();

      if (modbusStatus.status === 'connected') {
        return {
          modbus: {
            status: 'up',
            host: modbusStatus.host,
            port: modbusStatus.port,
            message: modbusStatus.message,
          },
        };
      } else {
        return {
          modbus: {
            status: 'down',
            host: modbusStatus.host,
            port: modbusStatus.port,
            error: modbusStatus.error || 'Modbus connection failed',
            details: modbusStatus.details,
          },
        };
      }
    } catch (error) {
      return {
        modbus: {
          status: 'down',
          error: error instanceof Error ? error.message : 'Modbus check failed',
        },
      };
    }
  }
}
