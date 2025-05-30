import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReading } from '@/modules/device-readings/entities/device-reading.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeviceReadingsModule } from '@/modules/device-readings/device-readings.module';
import { HealthModule } from '@/modules/health/health.module';
import { testDataSourceOptions } from '@/config/typeorm.config.test';

describe('DeviceReadingsController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<DeviceReading>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDataSourceOptions),
        DeviceReadingsModule,
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    repository = moduleFixture.get<Repository<DeviceReading>>(
      getRepositoryToken(DeviceReading),
    );
    await app.init();
  });

  afterEach(async () => {
    await repository.clear();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/device-readings (GET)', () => {
    it('should return an empty array of readings', () => {
      return request(app.getHttpServer())
        .get('/device-readings')
        .expect(200)
        .expect([]);
    });

    it('should return an array of readings', async () => {
      const reading = await repository.save({
        address: 1,
        value: 23.5,
      });

      return request(app.getHttpServer())
        .get('/device-readings')
        .expect(200)
        .expect([
          {
            id: reading.id,
            address: reading.address,
            value: reading.value,
            createdAt: reading.createdAt.toISOString(),
          },
        ]);
    });
  });
}); 