import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from '@/modules/health/health.module';
import { DeviceReadingsModule } from '@/modules/device-readings/device-readings.module';
import { testDataSourceOptions } from '@/config/typeorm.config.test';

describe('AppController (e2e)', () => {
  let app: INestApplication;

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
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect((res) => {
        // Accept either 200 (all services up) or 503 (some services down)
        expect([200, 503]).toContain(res.status);
        expect(res.body).toHaveProperty('status');
        expect(['ok', 'error']).toContain(res.body.status);
        expect(res.body).toHaveProperty('info');
        expect(res.body).toHaveProperty('error');
        expect(res.body).toHaveProperty('details');
      });
  });
});
