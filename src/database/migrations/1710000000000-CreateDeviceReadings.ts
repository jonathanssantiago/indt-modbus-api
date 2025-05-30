import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDeviceReadings1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'device_readings',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'address',
            type: 'integer',
          },
          {
            name: 'value',
            type: 'float',
            precision: 10,
            scale: 2,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Criar índice para melhorar performance de consultas por endereço
    await queryRunner.query(
      'CREATE INDEX idx_device_readings_address ON device_readings(address)',
    );

    // Criar índice para melhorar performance de consultas por data
    await queryRunner.query(
      'CREATE INDEX idx_device_readings_created_at ON device_readings(created_at)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('device_readings', 'idx_device_readings_created_at');
    await queryRunner.dropIndex('device_readings', 'idx_device_readings_address');
    await queryRunner.dropTable('device_readings');
  }
} 