import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import { DeviceReading } from '../../modules/device-readings/entities/device-reading.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'modbus_db',
  entities: [DeviceReading],
  synchronize: false,
});

async function seed() {
  try {
    await dataSource.initialize();
    // Não vamos apagar o bd porque queremos preservar a estrutura das migrações
    await runSeeders(dataSource, {
      seeds: ['src/database/seeds/*.seed.ts'],
    });
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
    process.exit();
  }
}

seed();
