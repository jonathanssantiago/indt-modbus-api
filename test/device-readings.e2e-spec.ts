import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DeviceReading,
  DeviceReadingType,
} from '@/modules/device-readings/entities/device-reading.entity';
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

  describe('/device-readings/history (GET)', () => {
    it('should return an empty array of readings', () => {
      return request(app.getHttpServer())
        .get('/device-readings/history')
        .expect(200)
        .expect([]);
    });

    it('should return an array of readings', async () => {
      const reading = await repository.save({
        address: DeviceReadingType.VOLTAGE,
        value: 23.5,
      });

      return request(app.getHttpServer())
        .get('/device-readings/history')
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

  describe('/device-readings/last-reading (GET)', () => {
    it('should return empty object when there is no reading', () => {
      return request(app.getHttpServer())
        .get('/device-readings/last-reading')
        .expect(200)
        .expect({});
    });

    it('should return the latest reading', async () => {
      const reading = await repository.save({
        address: DeviceReadingType.TEMPERATURE,
        value: 99.9,
      });
      return request(app.getHttpServer())
        .get('/device-readings/last-reading')
        .expect(200)
        .expect({
          id: reading.id,
          address: reading.address,
          value: reading.value,
          createdAt: reading.createdAt.toISOString(),
        });
    });
  });

  describe('/device-readings/history (GET) - múltiplos', () => {
    it('should return all readings in history in order of createdAt DESC', async () => {
      const now = new Date();
      const reading2 = await repository.save({
        address: DeviceReadingType.TEMPERATURE,
        value: 20,
        createdAt: now,
      });
      const reading1 = await repository.save({
        address: DeviceReadingType.CURRENT,
        value: 10,
        createdAt: new Date(now.getTime() - 1000),
      });
      // O controller retorna do mais recente para o mais antigo
      return request(app.getHttpServer())
        .get('/device-readings/history')
        .expect(200)
        .expect([
          {
            id: reading2.id,
            address: reading2.address,
            value: reading2.value,
            createdAt: reading2.createdAt.toISOString(),
          },
          {
            id: reading1.id,
            address: reading1.address,
            value: reading1.value,
            createdAt: reading1.createdAt.toISOString(),
          },
        ]);
    });
  });

  describe('/device-readings/status (GET)', () => {
    it('should return status of modbus connection', async () => {
      const res = await request(app.getHttpServer())
        .get('/device-readings/status')
        .expect(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('host');
      expect(res.body).toHaveProperty('port');
      expect(res.body).toHaveProperty('timestamp');
      // status pode ser 'connected' ou 'disconnected' dependendo do ambiente
    });
  });
});
