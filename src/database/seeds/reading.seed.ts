import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { DeviceReading } from '../../modules/device-readings/entities/device-reading.entity';

export default class ReadingSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(DeviceReading);

    // Gerar 10 leituras com dados simulados
    const readings = Array.from({ length: 10 }, (_, index) => {
      const reading = new DeviceReading();
      reading.address = index;
      reading.value = Math.random() * 100; // Valor aleatório entre 0 e 100
      reading.createdAt = new Date(Date.now() - index * 60000); // Uma leitura a cada minuto
      return reading;
    });

    // Save all readings
    await repository.save(readings);
  }
} 