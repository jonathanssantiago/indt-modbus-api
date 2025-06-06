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
    it('should return an empty paginated result when no readings exist', () => {
      return request(app.getHttpServer())
        .get('/device-readings/history')
        .expect(200)
        .expect({
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        });
    });

    it('should return paginated readings with default parameters', async () => {
      const reading = await repository.save({
        type: DeviceReadingType.VOLTAGE,
        value: 23.5,
      });

      return request(app.getHttpServer())
        .get('/device-readings/history')
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual({
            data: [
              {
                id: reading.id,
                type: reading.type,
                value: reading.value,
                createdAt: reading.createdAt.toISOString(),
              },
            ],
            meta: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          });
        });
    });

    it('should return paginated readings with custom page and limit', async () => {
      // Create multiple readings
      const readings = [];
      for (let i = 0; i < 15; i++) {
        const reading = await repository.save({
          type: DeviceReadingType.VOLTAGE,
          value: 20 + i,
        });
        readings.push(reading);
      }

      return request(app.getHttpServer())
        .get('/device-readings/history?page=2&limit=5')
        .expect(200)
        .then((response) => {
          expect(response.body.data).toHaveLength(5);
          expect(response.body.meta).toEqual({
            total: 15,
            page: 2,
            limit: 5,
            totalPages: 3,
          });
        });
    });

    it('should handle invalid pagination parameters', async () => {
      const reading = await repository.save({
        type: DeviceReadingType.VOLTAGE,
        value: 23.5,
      });

      return request(app.getHttpServer())
        .get('/device-readings/history?page=0&limit=200')
        .expect(200)
        .then((response) => {
          expect(response.body.meta.page).toBe(1); // Should be corrected to 1
          expect(response.body.meta.limit).toBe(100); // Should be corrected to max 100
        });
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
        type: DeviceReadingType.TEMPERATURE,
        value: 99.9,
      });
      return request(app.getHttpServer())
        .get('/device-readings/last-reading')
        .expect(200)
        .expect({
          id: reading.id,
          type: reading.type,
          value: reading.value,
          createdAt: reading.createdAt.toISOString(),
        });
    });
  });

  describe('/device-readings/history (GET) - múltiplos', () => {
    it('should return all readings in paginated format ordered by createdAt DESC', async () => {
      const now = new Date();
      const reading2 = await repository.save({
        type: DeviceReadingType.TEMPERATURE,
        value: 20,
        createdAt: now,
      });
      const reading1 = await repository.save({
        type: DeviceReadingType.CURRENT,
        value: 10,
        createdAt: new Date(now.getTime() - 1000),
      });

      // O controller retorna do mais recente para o mais antigo em formato paginado
      return request(app.getHttpServer())
        .get('/device-readings/history')
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual({
            data: [
              {
                id: reading2.id,
                type: reading2.type,
                value: reading2.value,
                createdAt: reading2.createdAt.toISOString(),
              },
              {
                id: reading1.id,
                type: reading1.type,
                value: reading1.value,
                createdAt: reading1.createdAt.toISOString(),
              },
            ],
            meta: {
              total: 2,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          });
        });
    });

    it('should respect pagination when there are many readings', async () => {
      // Create 12 readings
      const readings = [];
      for (let i = 0; i < 12; i++) {
        const reading = await repository.save({
          type: DeviceReadingType.VOLTAGE,
          value: i + 1,
          createdAt: new Date(Date.now() + i * 1000), // Different timestamps
        });
        readings.push(reading);
      }

      // Test first page
      const firstPageResponse = await request(app.getHttpServer())
        .get('/device-readings/history?page=1&limit=5')
        .expect(200);

      expect(firstPageResponse.body.data).toHaveLength(5);
      expect(firstPageResponse.body.meta).toEqual({
        total: 12,
        page: 1,
        limit: 5,
        totalPages: 3,
      });

      // Test second page
      const secondPageResponse = await request(app.getHttpServer())
        .get('/device-readings/history?page=2&limit=5')
        .expect(200);

      expect(secondPageResponse.body.data).toHaveLength(5);
      expect(secondPageResponse.body.meta).toEqual({
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3,
      });

      // Test last page
      const lastPageResponse = await request(app.getHttpServer())
        .get('/device-readings/history?page=3&limit=5')
        .expect(200);

      expect(lastPageResponse.body.data).toHaveLength(2);
      expect(lastPageResponse.body.meta).toEqual({
        total: 12,
        page: 3,
        limit: 5,
        totalPages: 3,
      });
    });
  });

  describe('/device-readings/modbus-status (GET)', () => {
    it('should return status of modbus connection', async () => {
      const res = await request(app.getHttpServer())
        .get('/device-readings/modbus-status')
        .expect(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('host');
      expect(res.body).toHaveProperty('port');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});
