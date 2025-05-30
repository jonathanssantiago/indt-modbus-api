import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ModbusRTU from 'modbus-serial';
import { DeviceReading } from '../device-readings/entities/device-reading.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ModbusService implements OnModuleInit, OnModuleDestroy {
  private client: any;
  private modbusHost: string;
  private modbusPort: number;

  private isConnected: boolean = false;
  private isConnecting: boolean = false;

  // Endereços dos registradores Modbus
  private readonly VOLTAGE_ADDRESS = 100;
  private readonly CURRENT_ADDRESS = 101;
  private readonly TEMPERATURE_ADDRESS = 102;

  constructor(
    private configService: ConfigService,
    @InjectRepository(DeviceReading)
    private deviceReadingRepository: Repository<DeviceReading>,
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
    this.startConnectionCheck();
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
    } catch (error) {
      this.isConnected = false;
      console.error('Failed to connect to Modbus simulator:', error);
    } finally {
      this.isConnecting = false;
    }
  }

  private startReconnectLoop() {
    setInterval(async () => {
      if (!this.isConnected) {
        console.log('Attempting to reconnect to Modbus simulator...');
        await this.connect();
      }
    }, 5000);
  }

  private startConnectionCheck() {
    setInterval(async () => {
      try {
        // Tenta ler um registrador para verificar a conexão
        await this.client.readHoldingRegisters(this.VOLTAGE_ADDRESS, 1);
        if (!this.isConnected) {
          this.isConnected = true;
          console.log('Modbus connection restored');
        }
      } catch (error) {
        if (this.isConnected) {
          this.isConnected = false;
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
      }
    }
  }
}
