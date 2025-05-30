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
    it('should return array of readings', async () => {
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

      jest.spyOn(service, 'findAll').mockResolvedValue(mockReadings);

      const result = await controller.getHistory();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no readings exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([]);

      const result = await controller.getHistory();

      expect(result).toHaveLength(0);
      expect(service.findAll).toHaveBeenCalled();
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
