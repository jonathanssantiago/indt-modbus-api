import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ModbusService } from './modbus.service';
import {
  DeviceReading,
  DeviceReadingType,
} from '../device-readings/entities/device-reading.entity';
import { ModbusEvents } from './modbus.events';
import ModbusRTU from 'modbus-serial';

// Mock do modbus-serial
jest.mock('modbus-serial');

describe('ModbusService', () => {
  let service: ModbusService;
  let repository: Repository<DeviceReading>;
  let configService: ConfigService;
  let modbusEvents: ModbusEvents;
  let mockModbusClient: jest.Mocked<ModbusRTU>;

  beforeEach(async () => {
    // Configurar fake timers antes de criar o módulo
    jest.useFakeTimers();

    // Mock do cliente Modbus
    mockModbusClient = {
      connectTCP: jest.fn(),
      setID: jest.fn(),
      close: jest.fn(),
      readHoldingRegisters: jest.fn(),
    } as any;

    (ModbusRTU as jest.MockedClass<typeof ModbusRTU>).mockImplementation(
      () => mockModbusClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModbusService,
        {
          provide: getRepositoryToken(DeviceReading),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                MODBUS_HOST: 'localhost',
                MODBUS_PORT: 5020,
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: ModbusEvents,
          useValue: {
            emitConnectionStatus: jest.fn(),
            emitNewReading: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ModbusService>(ModbusService);
    repository = module.get<Repository<DeviceReading>>(
      getRepositoryToken(DeviceReading),
    );
    configService = module.get<ConfigService>(ConfigService);
    modbusEvents = module.get<ModbusEvents>(ModbusEvents);

    // Mockar os métodos que contêm setInterval para evitar que sejam executados automaticamente
    jest
      .spyOn(service as any, 'startReconnectLoop')
      .mockImplementation(() => {});
    jest.spyOn(service as any, 'startReadingLoop').mockImplementation(() => {});
    jest
      .spyOn(service as any, 'connectionCheckLoop')
      .mockImplementation(() => {});

    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      // Resetar o mock counter para verificar a chamada do construtor
      (ModbusRTU as jest.MockedClass<typeof ModbusRTU>).mockClear();

      // Criar uma nova instância para testar o construtor
      const testService = new ModbusService(
        configService,
        repository,
        modbusEvents,
      );

      expect(testService).toBeDefined();
      expect(testService['modbusHost']).toBe('localhost');
      expect(testService['modbusPort']).toBe(5020);
      expect(ModbusRTU).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      mockModbusClient.connectTCP.mockResolvedValue(undefined);

      await service['connect']();

      expect(mockModbusClient.connectTCP).toHaveBeenCalledWith('localhost', {
        port: 5020,
      });
      expect(mockModbusClient.setID).toHaveBeenCalledWith(0);
      expect(modbusEvents.emitConnectionStatus).toHaveBeenCalledWith(true);
    });

    it('should handle connection error', async () => {
      const error = new Error('Connection failed');
      mockModbusClient.connectTCP.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service['connect']();

      expect(mockModbusClient.connectTCP).toHaveBeenCalledWith('localhost', {
        port: 5020,
      });
      expect(modbusEvents.emitConnectionStatus).toHaveBeenCalledWith(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to connect to Modbus simulator:',
        error,
      );

      consoleSpy.mockRestore();
    });

    it('should not connect if already connected', async () => {
      // Simula que já está conectado
      service['isConnected'] = true;

      await service['connect']();

      expect(mockModbusClient.connectTCP).not.toHaveBeenCalled();
    });

    it('should not connect if already connecting', async () => {
      // Simula que já está conectando
      service['isConnecting'] = true;

      await service['connect']();

      expect(mockModbusClient.connectTCP).not.toHaveBeenCalled();
    });
  });

  describe('readRegisters', () => {
    it('should read and convert registers successfully', async () => {
      service['isConnected'] = true;

      const mockData = {
        data: [2150, 1250, 2500], // valores raw que serão convertidos
        buffer: Buffer.from([]),
      };

      mockModbusClient.readHoldingRegisters.mockResolvedValue(mockData);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.readRegisters();

      expect(mockModbusClient.readHoldingRegisters).toHaveBeenCalledWith(
        100,
        3,
      );
      expect(result).toEqual({
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Raw registers:',
        [2150, 1250, 2500],
      );
      expect(consoleSpy).toHaveBeenCalledWith('Converted values:', {
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
      });

      consoleSpy.mockRestore();
    });

    it('should throw error when not connected', async () => {
      service['isConnected'] = false;

      await expect(service.readRegisters()).rejects.toThrow(
        'Not connected to Modbus server',
      );
      expect(mockModbusClient.readHoldingRegisters).not.toHaveBeenCalled();
    });

    it('should handle modbus reading error', async () => {
      service['isConnected'] = true;
      const error = new Error('Modbus read error');
      mockModbusClient.readHoldingRegisters.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.readRegisters()).rejects.toThrow(
        'Modbus read error',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading Modbus registers:',
        error,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      service['isConnected'] = true;
      mockModbusClient.close.mockImplementation(jest.fn());

      await service.disconnect();

      expect(mockModbusClient.close).toHaveBeenCalled();
      expect(modbusEvents.emitConnectionStatus).toHaveBeenCalledWith(false);
    });

    it('should handle disconnect error gracefully', async () => {
      service['isConnected'] = true;
      mockModbusClient.close.mockImplementation(() => {
        throw new Error('Close error');
      });

      await expect(service.disconnect()).resolves.not.toThrow();
      expect(modbusEvents.emitConnectionStatus).toHaveBeenCalledWith(false);
    });

    it('should not emit status change if already disconnected', async () => {
      service['isConnected'] = false;
      mockModbusClient.close.mockImplementation(jest.fn());

      await service.disconnect();

      expect(mockModbusClient.close).toHaveBeenCalled();
      expect(modbusEvents.emitConnectionStatus).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close client on module destroy', () => {
      service.onModuleDestroy();
      expect(mockModbusClient.close).toHaveBeenCalled();
    });
  });

  describe('reading loop', () => {
    beforeEach(() => {
      service['isConnected'] = true;
      jest.spyOn(service, 'readRegisters').mockResolvedValue({
        voltage: 21.5,
        current: 12.5,
        temperature: 25.0,
      });
      // Restaurar a implementação original para este describe
      (service as any).startReadingLoop.mockRestore();
    });

    it('should save readings when connected', async () => {
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue({} as DeviceReading);

      // Criar um mock manual do setInterval para simular o comportamento
      const intervalCallback = jest.fn();
      jest.spyOn(global, 'setInterval').mockImplementation((cb, time) => {
        intervalCallback.mockImplementation(cb as any);
        return 1 as any;
      });

      // Inicia o loop de leitura
      service['startReadingLoop']();

      // Executar o callback manualmente
      await intervalCallback();

      expect(saveSpy).toHaveBeenCalledTimes(3);
      expect(saveSpy).toHaveBeenCalledWith({
        type: DeviceReadingType.VOLTAGE,
        value: 21.5,
      });
      expect(saveSpy).toHaveBeenCalledWith({
        type: DeviceReadingType.CURRENT,
        value: 12.5,
      });
      expect(saveSpy).toHaveBeenCalledWith({
        type: DeviceReadingType.TEMPERATURE,
        value: 25.0,
      });

      // Restaurar o mock
      (global.setInterval as jest.Mock).mockRestore();
    });

    it('should not save readings when disconnected', async () => {
      service['isConnected'] = false;
      const saveSpy = jest.spyOn(repository, 'save');

      const intervalCallback = jest.fn();
      jest.spyOn(global, 'setInterval').mockImplementation((cb, time) => {
        intervalCallback.mockImplementation(cb as any);
        return 1 as any;
      });

      service['startReadingLoop']();
      await intervalCallback();

      expect(saveSpy).not.toHaveBeenCalled();

      (global.setInterval as jest.Mock).mockRestore();
    });

    it('should handle reading error gracefully', async () => {
      const error = new Error('Reading error');
      jest.spyOn(service, 'readRegisters').mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const intervalCallback = jest.fn();
      jest.spyOn(global, 'setInterval').mockImplementation((cb, time) => {
        intervalCallback.mockImplementation(cb as any);
        return 1 as any;
      });

      service['startReadingLoop']();
      await intervalCallback();

      expect(consoleSpy).toHaveBeenCalledWith('Error in reading loop:', error);

      consoleSpy.mockRestore();
      (global.setInterval as jest.Mock).mockRestore();
    });
  });

  describe('reconnect loop', () => {
    beforeEach(() => {
      // Restaurar a implementação original para este describe
      (service as any).startReconnectLoop.mockRestore();
    });

    it('should attempt reconnection when disconnected', async () => {
      service['isConnected'] = false;
      const connectSpy = jest
        .spyOn(service as any, 'connect')
        .mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const intervalCallback = jest.fn();
      jest.spyOn(global, 'setInterval').mockImplementation((cb, time) => {
        intervalCallback.mockImplementation(cb as any);
        return 1 as any;
      });

      service['startReconnectLoop']();
      await intervalCallback();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Attempting to reconnect to Modbus simulator...',
      );
      expect(connectSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      (global.setInterval as jest.Mock).mockRestore();
    });

    it('should not attempt reconnection when connected', async () => {
      service['isConnected'] = true;
      const connectSpy = jest.spyOn(service as any, 'connect');

      const intervalCallback = jest.fn();
      jest.spyOn(global, 'setInterval').mockImplementation((cb, time) => {
        intervalCallback.mockImplementation(cb as any);
        return 1 as any;
      });

      service['startReconnectLoop']();
      await intervalCallback();

      expect(connectSpy).not.toHaveBeenCalled();

      (global.setInterval as jest.Mock).mockRestore();
    });
  });

  describe('connection check loop', () => {
    beforeEach(() => {
      // Restaurar a implementação original para este describe
      (service as any).connectionCheckLoop.mockRestore();
    });

    it('should detect connection restoration', async () => {
      service['isConnected'] = false;
      mockModbusClient.readHoldingRegisters.mockResolvedValue({
        data: [1000],
        buffer: Buffer.from([]),
      });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const intervalCallback = jest.fn();
      jest.spyOn(global, 'setInterval').mockImplementation((cb, time) => {
        intervalCallback.mockImplementation(cb as any);
        return 1 as any;
      });

      service['connectionCheckLoop']();
      await intervalCallback();

      expect(mockModbusClient.readHoldingRegisters).toHaveBeenCalledWith(
        100,
        1,
      );
      expect(modbusEvents.emitConnectionStatus).toHaveBeenCalledWith(true);
      expect(consoleSpy).toHaveBeenCalledWith('Modbus connection restored');

      consoleSpy.mockRestore();
      (global.setInterval as jest.Mock).mockRestore();
    });

    it('should detect connection loss', async () => {
      service['isConnected'] = true;
      mockModbusClient.readHoldingRegisters.mockRejectedValue(
        new Error('Connection lost'),
      );
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const intervalCallback = jest.fn();
      jest.spyOn(global, 'setInterval').mockImplementation((cb, time) => {
        intervalCallback.mockImplementation(cb as any);
        return 1 as any;
      });

      service['connectionCheckLoop']();
      await intervalCallback();

      expect(mockModbusClient.readHoldingRegisters).toHaveBeenCalledWith(
        100,
        1,
      );
      expect(modbusEvents.emitConnectionStatus).toHaveBeenCalledWith(false);
      expect(consoleSpy).toHaveBeenCalledWith('Modbus connection lost');

      consoleSpy.mockRestore();
      (global.setInterval as jest.Mock).mockRestore();
    });

    it('should emit status even if connection state unchanged', async () => {
      service['isConnected'] = true;
      mockModbusClient.readHoldingRegisters.mockResolvedValue({
        data: [1000],
        buffer: Buffer.from([]),
      });

      const intervalCallback = jest.fn();
      jest.spyOn(global, 'setInterval').mockImplementation((cb, time) => {
        intervalCallback.mockImplementation(cb as any);
        return 1 as any;
      });

      service['connectionCheckLoop']();
      await intervalCallback();

      expect(modbusEvents.emitConnectionStatus).toHaveBeenCalledWith(true);

      (global.setInterval as jest.Mock).mockRestore();
    });
  });
});
