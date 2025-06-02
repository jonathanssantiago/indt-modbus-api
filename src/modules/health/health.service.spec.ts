import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthService } from './health.service';
import { DeviceReading } from '../device-readings/entities/device-reading.entity';
import { DeviceReadingsService } from '../device-readings/device-readings.service';

describe('HealthService', () => {
  let service: HealthService;
  let deviceReadingRepository: Repository<DeviceReading>;
  let deviceReadingsService: DeviceReadingsService;

  const mockRepository = {
    query: jest.fn(),
  };

  const mockDeviceReadingsService = {
    statusModbusService: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getRepositoryToken(DeviceReading),
          useValue: mockRepository,
        },
        {
          provide: DeviceReadingsService,
          useValue: mockDeviceReadingsService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    deviceReadingRepository = module.get<Repository<DeviceReading>>(
      getRepositoryToken(DeviceReading),
    );
    deviceReadingsService = module.get<DeviceReadingsService>(
      DeviceReadingsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDatabase', () => {
    it('should return database status as up when query succeeds', async () => {
      mockRepository.query.mockResolvedValueOnce([{ 1: 1 }]);

      const result = await service.checkDatabase();

      expect(result).toEqual({
        database: {
          status: 'up',
        },
      });
      expect(mockRepository.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return database status as down when query fails', async () => {
      const error = new Error('Database connection failed');
      mockRepository.query.mockRejectedValueOnce(error);

      const result = await service.checkDatabase();

      expect(result).toEqual({
        database: {
          status: 'down',
          error: 'Database connection failed',
        },
      });
    });

    it('should handle non-Error objects', async () => {
      mockRepository.query.mockRejectedValueOnce('string error');

      const result = await service.checkDatabase();

      expect(result).toEqual({
        database: {
          status: 'down',
          error: 'Database check failed',
        },
      });
    });
  });

  describe('checkModbus', () => {
    it('should return modbus status as up when connected', async () => {
      const modbusStatus = {
        status: 'connected',
        host: '127.0.0.1',
        port: 5020,
        message: 'Connected successfully',
      };
      mockDeviceReadingsService.statusModbusService.mockResolvedValueOnce(
        modbusStatus,
      );

      const result = await service.checkModbus();

      expect(result).toEqual({
        modbus: {
          status: 'up',
          host: '127.0.0.1',
          port: 5020,
          message: 'Connected successfully',
        },
      });
    });

    it('should return modbus status as down when disconnected', async () => {
      const modbusStatus = {
        status: 'disconnected',
        host: '127.0.0.1',
        port: 5020,
        error: 'Connection failed',
        details: 'Timeout error',
      };
      mockDeviceReadingsService.statusModbusService.mockResolvedValueOnce(
        modbusStatus,
      );

      const result = await service.checkModbus();

      expect(result).toEqual({
        modbus: {
          status: 'down',
          host: '127.0.0.1',
          port: 5020,
          error: 'Connection failed',
          details: 'Timeout error',
        },
      });
    });

    it('should handle errors from statusModbusService', async () => {
      const error = new Error('Service error');
      mockDeviceReadingsService.statusModbusService.mockRejectedValueOnce(
        error,
      );

      const result = await service.checkModbus();

      expect(result).toEqual({
        modbus: {
          status: 'down',
          error: 'Service error',
        },
      });
    });

    it('should handle non-Error objects from statusModbusService', async () => {
      mockDeviceReadingsService.statusModbusService.mockRejectedValueOnce(
        'string error',
      );

      const result = await service.checkModbus();

      expect(result).toEqual({
        modbus: {
          status: 'down',
          error: 'Modbus check failed',
        },
      });
    });
  });
});
