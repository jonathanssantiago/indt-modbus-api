import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import ModbusRTU from 'modbus-serial';
import { DeviceReading } from './entities/device-reading.entity';
import { CreateDeviceReadingDto } from './dto/create-device-reading.dto';

@Injectable()
export class DeviceReadingsService {
  private client: any;
  private modbusHost: string;
  private modbusPort: number;

  constructor(
    @InjectRepository(DeviceReading)
    private deviceReadingsRepository: Repository<DeviceReading>,
    private configService: ConfigService,
  ) {
    this.modbusHost = this.configService.get<string>(
      'MODBUS_HOST',
      'localhost',
    );
    this.modbusPort = this.configService.get<number>('MODBUS_PORT', 5020);
    this.client = new ModbusRTU();
  }

  async create(
    createDeviceReadingDto: CreateDeviceReadingDto,
  ): Promise<DeviceReading> {
    return this.deviceReadingsRepository.save(createDeviceReadingDto);
  }

  async findAll(): Promise<DeviceReading[]> {
    return await this.deviceReadingsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findLatest(): Promise<DeviceReading | null> {
    const readings = await this.deviceReadingsRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });
    return readings.length > 0 ? readings[0] : null;
  }

  async statusModbusService() {
    const host = this.modbusHost;
    const port = this.modbusPort;
    const timestamp = new Date().toISOString();
    try {
      await this.client.connectTCP(host, { port });
      this.client.setID(0);
      const result = await this.client.readHoldingRegisters(100, 1);

      if (result && result.data) {
        return {
          status: 'connected',
          host,
          port,
          timestamp,
          message: 'Modbus simulator is connected',
        };
      }

      return {
        status: 'disconnected',
        host,
        port,
        timestamp,
        error: 'No data received from Modbus simulator',
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error('Failed to connect to Modbus simulator:', err);
      return {
        status: 'disconnected',
        host,
        port,
        timestamp,
        error: 'Failed to connect to Modbus simulator',
        details: error,
      };
    }
  }
}
