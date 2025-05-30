import { Test, TestingModule } from '@nestjs/testing';
import { DeviceReadingsController } from './device-readings.controller';
import { DeviceReadingsService } from './device-readings.service';
import { DeviceReading } from './entities/device-reading.entity';

describe('DeviceReadingsController', () => {
  let controller: DeviceReadingsController;
  let service: DeviceReadingsService;

  const mockDeviceReadingsService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceReadingsController],
      providers: [
        {
          provide: DeviceReadingsService,
          useValue: mockDeviceReadingsService,
        },
      ],
    }).compile();

    controller = module.get<DeviceReadingsController>(DeviceReadingsController);
    service = module.get<DeviceReadingsService>(DeviceReadingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of device readings', async () => {
      const result = [new DeviceReading()];
      jest.spyOn(service, 'findAll').mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
    });
  });
}); 