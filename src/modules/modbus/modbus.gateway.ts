import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { ModbusReading } from './modbus.events';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ModbusGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  private isModbusConnected: boolean = false;
  private lastReading: ModbusReading | null = null;

  afterInit() {
    console.log('WebSocket Gateway initialized');
  }

  @OnEvent('modbus.newReading')
  handleNewReading(reading: ModbusReading) {
    console.log('New Modbus reading received:', reading);
    this.lastReading = reading;
    this.server.emit('modbusData', {
      voltage: reading.voltage,
      current: reading.current,
      temperature: reading.temperature,
      timestamp: reading.timestamp.toISOString(),
    });
  }

  @OnEvent('modbus.connectionStatus')
  handleConnectionStatus(isConnected: boolean) {
    this.isModbusConnected = isConnected;
    console.log('Modbus connection status:', isConnected);
    this.server.emit('connectionStatus', isConnected);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Envia o status atual de conexão e última leitura para o novo cliente
    client.emit('connectionStatus', this.isModbusConnected);
    if (this.lastReading) {
      client.emit('modbusData', {
        voltage: this.lastReading.voltage,
        current: this.lastReading.current,
        temperature: this.lastReading.temperature,
        timestamp: this.lastReading.timestamp.toISOString(),
      });
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
