import { Test, TestingModule } from '@nestjs/testing';
import { ModbusGateway } from './modbus.gateway';
import { ModbusReading } from './modbus.events';
import { Server, Socket } from 'socket.io';

describe('ModbusGateway', () => {
  let gateway: ModbusGateway;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    } as any;

    mockSocket = {
      id: 'test-socket-id',
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ModbusGateway],
    }).compile();

    gateway = module.get<ModbusGateway>(ModbusGateway);
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.afterInit();

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('handleNewReading', () => {
    it('should handle new modbus reading and emit to all clients', () => {
      const reading: ModbusReading = {
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
        timestamp: new Date('2025-05-30T10:00:00Z'),
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleNewReading(reading);

      expect(consoleSpy).toHaveBeenCalledWith(
        'New Modbus reading received:',
        reading,
      );
      expect(mockServer.emit).toHaveBeenCalledWith('modbusData', {
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
        timestamp: '2025-05-30T10:00:00.000Z',
      });

      consoleSpy.mockRestore();
    });

    it('should store last reading', () => {
      const reading: ModbusReading = {
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
        timestamp: new Date('2025-05-30T10:00:00Z'),
      };

      gateway.handleNewReading(reading);

      expect(gateway['lastReading']).toEqual(reading);
    });
  });

  describe('handleConnectionStatus', () => {
    it('should handle connection status and emit to all clients', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnectionStatus(true);

      expect(gateway['isModbusConnected']).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Modbus connection status:',
        true,
      );
      expect(mockServer.emit).toHaveBeenCalledWith('connectionStatus', true);

      consoleSpy.mockRestore();
    });

    it('should handle disconnection status', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnectionStatus(false);

      expect(gateway['isModbusConnected']).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Modbus connection status:',
        false,
      );
      expect(mockServer.emit).toHaveBeenCalledWith('connectionStatus', false);

      consoleSpy.mockRestore();
    });
  });

  describe('handleConnection', () => {
    it('should handle new client connection and send current status', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Configura um estado inicial
      gateway['isModbusConnected'] = true;

      gateway.handleConnection(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Client connected: test-socket-id',
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('connectionStatus', true);

      consoleSpy.mockRestore();
    });

    it('should send last reading to new client if available', () => {
      const lastReading: ModbusReading = {
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
        timestamp: new Date('2025-05-30T10:00:00Z'),
      };

      gateway['lastReading'] = lastReading;
      gateway['isModbusConnected'] = true;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('connectionStatus', true);
      expect(mockSocket.emit).toHaveBeenCalledWith('modbusData', {
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
        timestamp: '2025-05-30T10:00:00.000Z',
      });

      consoleSpy.mockRestore();
    });

    it('should not send reading if no last reading available', () => {
      gateway['lastReading'] = null;
      gateway['isModbusConnected'] = false;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('connectionStatus', false);
      expect(mockSocket.emit).toHaveBeenCalledTimes(1); // Só o connectionStatus

      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleDisconnect(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Client disconnected: test-socket-id',
      );

      consoleSpy.mockRestore();
    });
  });
});
