import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceReadingsService } from './device-readings.service';
import { DeviceReading } from './entities/device-reading.entity';

describe('DeviceReadingsService', () => {
  let service: DeviceReadingsService;
  let repository: Repository<DeviceReading>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceReadingsService,
        {
          provide: getRepositoryToken(DeviceReading),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DeviceReadingsService>(DeviceReadingsService);
    repository = module.get<Repository<DeviceReading>>(getRepositoryToken(DeviceReading));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of device readings', async () => {
      const result = [new DeviceReading()];
      jest.spyOn(repository, 'find').mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
    });
  });

  describe('findLatestByAddress', () => {
    it('should return the latest reading for a given address', async () => {
      const result = new DeviceReading();
      jest.spyOn(repository, 'findOne').mockResolvedValue(result);

      expect(await service.findLatestByAddress(1)).toBe(result);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { address: 1 },
        order: { createdAt: 'DESC' }
      });
    });
  });

  describe('findHistoryByAddress', () => {
    it('should return the reading history for a given address', async () => {
      const result = [new DeviceReading()];
      jest.spyOn(repository, 'find').mockResolvedValue(result);

      expect(await service.findHistoryByAddress(1)).toBe(result);
      expect(repository.find).toHaveBeenCalledWith({
        where: { address: 1 },
        order: { createdAt: 'DESC' },
        take: 100
      });
    });
  });
}); 