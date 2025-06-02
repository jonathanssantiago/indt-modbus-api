import { Test, TestingModule } from '@nestjs/testing';
import { DeviceReadingsController } from './device-readings.controller';
import { DeviceReadingsService } from './device-readings.service';
import {
  DeviceReading,
  DeviceReadingType,
} from './entities/device-reading.entity';

describe('DeviceReadingsController', () => {
  let controller: DeviceReadingsController;
  let service: DeviceReadingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceReadingsController],
      providers: [
        {
          provide: DeviceReadingsService,
          useValue: {
            findAll: jest.fn(),
            findAllPaginated: jest.fn(),
            findLatest: jest.fn(),
            statusModbusService: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DeviceReadingsController>(DeviceReadingsController);
    service = module.get<DeviceReadingsService>(DeviceReadingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLastReading', () => {
    it('should return the latest reading when available', async () => {
      const mockReading: DeviceReading = {
        id: 1,
        type: DeviceReadingType.VOLTAGE,
        value: 42,
        createdAt: new Date('2025-05-29T10:00:00'),
      };

      jest.spyOn(service, 'findLatest').mockResolvedValue(mockReading);

      const result = await controller.getLastReading();

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.type).toBe(DeviceReadingType.VOLTAGE);
      expect(result.value).toBe(42);
      expect(service.findLatest).toHaveBeenCalled();
    });

    it('should return null when no reading is available', async () => {
      jest.spyOn(service, 'findLatest').mockResolvedValue(null);

      const result = await controller.getLastReading();

      expect(result).toBeNull();
      expect(service.findLatest).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return paginated readings with default parameters', async () => {
      const mockReadings: DeviceReading[] = [
        {
          id: 1,
          type: DeviceReadingType.VOLTAGE,
          value: 42,
          createdAt: new Date('2025-05-29T10:00:00'),
        },
        {
          id: 2,
          type: DeviceReadingType.CURRENT,
          value: 43,
          createdAt: new Date('2025-05-29T09:00:00'),
        },
      ];

      jest.spyOn(service, 'findAllPaginated').mockResolvedValue({
        readings: mockReadings,
        total: 15,
      });

      const result = await controller.getHistory();

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 }),
        ]),
        meta: {
          total: 15,
          page: 1,
          limit: 10,
          totalPages: 2,
        },
      });
      expect(service.findAllPaginated).toHaveBeenCalledWith(1, 10);
    });

    it('should return paginated readings with custom parameters', async () => {
      const mockReadings: DeviceReading[] = [
        {
          id: 3,
          type: DeviceReadingType.VOLTAGE,
          value: 50,
          createdAt: new Date('2025-05-29T10:00:00'),
        },
      ];

      jest.spyOn(service, 'findAllPaginated').mockResolvedValue({
        readings: mockReadings,
        total: 25,
      });

      const result = await controller.getHistory('2', '5');

      expect(result).toEqual({
        data: expect.arrayContaining([expect.objectContaining({ id: 3 })]),
        meta: {
          total: 25,
          page: 2,
          limit: 5,
          totalPages: 5,
        },
      });
      expect(service.findAllPaginated).toHaveBeenCalledWith(2, 5);
    });

    it('should handle invalid page and limit parameters', async () => {
      const mockReadings: DeviceReading[] = [];

      jest.spyOn(service, 'findAllPaginated').mockResolvedValue({
        readings: mockReadings,
        total: 0,
      });

      const result = await controller.getHistory('0', '200');

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1, // Should be corrected to minimum 1
          limit: 100, // Should be corrected to maximum 100
          totalPages: 0,
        },
      });
      expect(service.findAllPaginated).toHaveBeenCalledWith(1, 100);
    });

    it('should return empty paginated result when no readings exist', async () => {
      jest.spyOn(service, 'findAllPaginated').mockResolvedValue({
        readings: [],
        total: 0,
      });

      const result = await controller.getHistory();

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });
      expect(service.findAllPaginated).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getStatus', () => {
    it('should return connected status when service is working', async () => {
      const mockStatus = {
        status: 'connected',
        host: 'localhost',
        port: 5020,
        timestamp: '2025-05-29T10:00:00.000Z',
        message: 'Modbus simulator is connected',
      };

      jest.spyOn(service, 'statusModbusService').mockResolvedValue(mockStatus);

      const result = await controller.getStatus();

      expect(result).toEqual(mockStatus);
      expect(service.statusModbusService).toHaveBeenCalled();
    });

    it('should return error status when service is not available', async () => {
      const mockStatus = {
        status: 'disconnected',
        host: 'localhost',
        port: 5020,
        timestamp: '2025-05-29T10:00:00.000Z',
        error: 'Failed to connect to Modbus simulator',
        details: 'Connection failed',
      };

      jest.spyOn(service, 'statusModbusService').mockResolvedValue(mockStatus);

      const result = await controller.getStatus();

      expect(result).toEqual(mockStatus);
      expect(service.statusModbusService).toHaveBeenCalled();
    });
  });
});
