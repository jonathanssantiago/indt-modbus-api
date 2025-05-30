import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ModbusRTU from 'modbus-serial';
import {
  DeviceReading,
  DeviceReadingType,
} from '../device-readings/entities/device-reading.entity';
import { ConfigService } from '@nestjs/config';
import { ModbusEvents } from './modbus.events';

@Injectable()
export class ModbusService implements OnModuleInit, OnModuleDestroy {
  private client: ModbusRTU;
  private modbusHost: string;
  private modbusPort: number;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(DeviceReading)
    private deviceReadingRepository: Repository<DeviceReading>,
    private modbusEvents: ModbusEvents,
  ) {
    this.modbusHost = this.configService.get<string>(
      'MODBUS_HOST',
      'localhost',
    );
    this.modbusPort = this.configService.get<number>('MODBUS_PORT', 5020);
    this.client = new ModbusRTU();
  }

  async onModuleInit() {
    await this.connect();
    this.startReconnectLoop();
    this.startReadingLoop();
  }

  onModuleDestroy() {
    this.client.close();
  }

  private async connect() {
    if (this.isConnected || this.isConnecting) return;
    this.isConnecting = true;
    try {
      await this.client.connectTCP(this.modbusHost, { port: this.modbusPort });
      this.client.setID(0);
      console.log('Connected to Modbus simulator (TCP handshake)');
      this.isConnected = true;
      this.modbusEvents.emitConnectionStatus(true);
    } catch (error) {
      this.isConnected = false;
      this.modbusEvents.emitConnectionStatus(false);
      console.error('Failed to connect to Modbus simulator:', error);
    } finally {
      this.isConnecting = false;
    }
  }

  private async startReconnectLoop() {
    if (!this.isConnected) {
      console.log('Attempting to reconnect to Modbus simulator...');
      await this.connect();
    }
  }

  private startReadingLoop() {
    setInterval(async () => {
      if (this.isConnected) {
        try {
          const readings = await this.readRegisters();

          // Salva no bd
          await Promise.all([
            this.deviceReadingRepository.save({
              type: DeviceReadingType.VOLTAGE,
              value: readings.voltage,
            }),
            this.deviceReadingRepository.save({
              type: DeviceReadingType.CURRENT,
              value: readings.current,
            }),
            this.deviceReadingRepository.save({
              type: DeviceReadingType.TEMPERATURE,
              value: readings.temperature,
            }),
          ]);
        } catch (error) {
          console.error('Error in reading loop:', error);
        }
      }
    }, 5000);
  }

  async readRegisters() {
    if (!this.isConnected) {
      throw new Error('Not connected to Modbus server');
    }

    try {
      const result = await this.client.readHoldingRegisters(100, 3);

      console.log('Raw registers:', result.data);

      const voltage = result.data[0] / 100.0;
      const current = result.data[1] / 100.0;
      const temperature = result.data[2] / 100.0;

      console.log('Converted values:', {
        voltage,
        current,
        temperature,
      });

      return {
        voltage: voltage,
        current: current,
        temperature: temperature,
      };
    } catch (error) {
      console.error('Error reading Modbus registers:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (e) {}
      if (this.isConnected) {
        this.isConnected = false;
        this.modbusEvents.emitConnectionStatus(false);
      }
    }
  }
}
