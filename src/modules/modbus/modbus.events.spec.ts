import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModbusEvents, ModbusReading } from './modbus.events';

describe('ModbusEvents', () => {
  let service: ModbusEvents;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModbusEvents,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ModbusEvents>(ModbusEvents);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emitNewReading', () => {
    it('should emit modbus.newReading event with reading data', () => {
      const reading: ModbusReading = {
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
        timestamp: new Date('2025-05-30T10:00:00Z'),
      };

      service.emitNewReading(reading);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'modbus.newReading',
        reading,
      );
    });
  });

  describe('emitConnectionStatus', () => {
    it('should emit modbus.connectionStatus event when connected', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.emitConnectionStatus(true);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'modbus.connectionStatus',
        true,
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Emitting connection status:',
        true,
      );

      consoleSpy.mockRestore();
    });

    it('should emit modbus.connectionStatus event when disconnected', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.emitConnectionStatus(false);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'modbus.connectionStatus',
        false,
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Emitting connection status:',
        false,
      );

      consoleSpy.mockRestore();
    });
  });
});
