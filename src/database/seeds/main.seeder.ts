import { DataSource } from 'typeorm';
import { runSeeder, Seeder } from 'typeorm-extension';
import ReadingSeeder from './reading.seed';

export class MainSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<void> {
        await runSeeder(dataSource, ReadingSeeder);
    }
} 