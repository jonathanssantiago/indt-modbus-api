import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DeviceReading } from '../device-readings/entities/device-reading.entity';
import { ModbusService } from './modbus.service';
import { ModbusEvents } from './modbus.events';
import { ModbusGateway } from './modbus.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceReading]),
    EventEmitterModule.forRoot(),
  ],
  providers: [ModbusService, ModbusEvents, ModbusGateway],
  exports: [ModbusService],
})
export class ModbusModule {}
