import { DataSourceOptions } from 'typeorm';
import { DeviceReading } from '@/modules/device-readings/entities/device-reading.entity';

export const testDataSourceOptions: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [DeviceReading],
  synchronize: true,
  logging: false,
};
