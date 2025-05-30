import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ModbusReading {
  voltage: number;
  current: number;
  temperature: number;
  timestamp: Date;
}

@Injectable()
export class ModbusEvents {
  constructor(private eventEmitter: EventEmitter2) {}

  emitNewReading(reading: ModbusReading) {
    this.eventEmitter.emit('modbus.newReading', reading);
  }

  emitConnectionStatus(isConnected: boolean) {
    console.log('Emitting connection status:', isConnected);
    this.eventEmitter.emit('modbus.connectionStatus', isConnected);
  }
} 