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
  private readingInterval: number;
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
    this.readingInterval = this.configService.get<number>(
      'READING_INTERVAL',
      5000,
    );
    this.client = new ModbusRTU();
  }

  async onModuleInit() {
    await this.connect();
    this.startReconnectLoop();
    this.startReadingLoop();
    this.connectionCheckLoop();
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
    setInterval(async () => {
      if (!this.isConnected) {
        console.log('Attempting to reconnect to Modbus simulator...');
        await this.connect();
      }
    }, 1000);
  }

  private startReadingLoop() {
    const readingInterval = this.readingInterval || 5000;

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
    }, readingInterval);
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

  private connectionCheckLoop() {
    setInterval(async () => {
      try {
        // Tenta ler um registrador para verificar a conexão
        await this.client.readHoldingRegisters(100, 1);
        // Se a leitura foi bem sucedida e o estado anterior era desconectado
        if (!this.isConnected) {
          this.isConnected = true;
          this.modbusEvents.emitConnectionStatus(true);
          console.log('Modbus connection restored');
        }
      } catch (error) {
        // Se houve erro e o estado anterior era conectado
        if (this.isConnected) {
          this.isConnected = false;
          this.modbusEvents.emitConnectionStatus(false);
          console.log('Modbus connection lost');
        }
      }
    }, 1000);
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
