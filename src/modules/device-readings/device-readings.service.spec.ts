import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeviceReadingsService } from './device-readings.service';
import {
  DeviceReading,
  DeviceReadingType,
} from './entities/device-reading.entity';
import { CreateDeviceReadingDto } from './dto/create-device-reading.dto';
import { DataSource } from 'typeorm';
import { testDataSourceOptions } from '../../config/typeorm.config.test';

const mockModbusClient = {
  connectTCP: jest.fn().mockResolvedValue(undefined),
  setID: jest.fn(),
  readHoldingRegisters: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock('modbus-serial', () => {
  return {
    __esModule: true,
    default: jest.fn(() => mockModbusClient),
  };
});

describe('DeviceReadingsService', () => {
  let service: DeviceReadingsService;
  let repository: Repository<DeviceReading>;
  let configService: ConfigService;
  let modbusClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        DeviceReadingsService,
        {
          provide: getRepositoryToken(DeviceReading),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: new DataSource(testDataSourceOptions),
        },
      ],
    }).compile();

    service = module.get<DeviceReadingsService>(DeviceReadingsService);
    repository = module.get<Repository<DeviceReading>>(
      getRepositoryToken(DeviceReading),
    );
    configService = module.get<ConfigService>(ConfigService);
    modbusClient = (service as any).client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of readings', async () => {
      const mockReadings = [
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
      jest.spyOn(repository, 'find').mockResolvedValue(mockReadings);

      const result = await service.findAll();

      expect(result).toEqual(mockReadings);
      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no readings exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findLatest', () => {
    it('should return the latest reading', async () => {
      const mockReading = {
        id: 1,
        type: DeviceReadingType.VOLTAGE,
        value: 42,
        createdAt: new Date('2025-05-29T10:00:00'),
      };
      jest.spyOn(repository, 'find').mockResolvedValue([mockReading]);

      const result = await service.findLatest();

      expect(result).toEqual(mockReading);
      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 1,
      });
    });

    it('should return null when no readings exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findLatest();

      expect(result).toBeNull();
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new reading successfully', async () => {
      const createReadingDto: CreateDeviceReadingDto = {
        type: DeviceReadingType.VOLTAGE,
        value: 42,
      };
      const mockReading = {
        id: 1,
        type: DeviceReadingType.VOLTAGE,
        value: 42,
        createdAt: new Date('2025-05-29T10:00:00'),
      };

      repository.save = jest.fn().mockResolvedValue(mockReading);

      const result = await service.create(createReadingDto);

      expect(result).toEqual(mockReading);
      expect(repository.save).toHaveBeenCalledWith(createReadingDto);
    });

    it('should handle errors when creating a reading', async () => {
      const createReadingDto: CreateDeviceReadingDto = {
        type: DeviceReadingType.CURRENT,
        value: 42,
      };
      jest
        .spyOn(repository, 'save')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.create(createReadingDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('statusModbusService', () => {
    it('should return disconnected status when service is working (mock não retorna dados)', async () => {
      // O mock padrão retorna undefined para readHoldingRegisters
      const result = await service.statusModbusService();
      expect(result).toMatchObject({
        status: 'disconnected',
        host: expect.any(String),
        port: expect.anything(),
        timestamp: expect.any(String),
        error: 'No data received from Modbus simulator',
      });
    });

    it('should return error status when connection fails', async () => {
      modbusClient.connectTCP = jest
        .fn()
        .mockRejectedValue(new Error('Connection failed'));
      const result = await service.statusModbusService();
      expect(result).toMatchObject({
        status: 'disconnected',
        host: expect.any(String),
        port: expect.anything(),
        timestamp: expect.any(String),
        error: 'Failed to connect to Modbus simulator',
        details: 'Connection failed',
      });
    });

    it('should handle error thrown as string', async () => {
      modbusClient.connectTCP = jest.fn().mockRejectedValue('string error');
      const result = await service.statusModbusService();
      expect(result).toMatchObject({
        status: 'disconnected',
        host: expect.any(String),
        port: expect.anything(),
        timestamp: expect.any(String),
        error: 'Failed to connect to Modbus simulator',
        details: 'string error',
      });
    });
  });
});
