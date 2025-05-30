import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeviceReadings1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se é PostgreSQL para usar enum
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // Criar o tipo enum no PostgreSQL
      await queryRunner.query(`
        CREATE TYPE "device_reading_type_enum" AS ENUM('VOLTAGE', 'CURRENT', 'TEMPERATURE')
      `);

      // Criar a tabela com enum
      await queryRunner.query(`
        CREATE TABLE "device_readings" (
          "id" SERIAL NOT NULL,
          "address" "device_reading_type_enum" NOT NULL,
          "value" NUMERIC(10,2) NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PK_device_readings" PRIMARY KEY ("id")
        )
      `);
    } else {
      // Para outros bancos (SQLite), usar varchar
      await queryRunner.query(`
        CREATE TABLE "device_readings" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "address" VARCHAR(20) NOT NULL CHECK ("address" IN ('VOLTAGE', 'CURRENT', 'TEMPERATURE')),
          "value" DECIMAL(10,2) NOT NULL,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "idx_device_readings_address" ON "device_readings" ("address")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_device_readings_created_at" ON "device_readings" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "device_readings"`);

    // Só dropar o enum se for PostgreSQL
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    if (isPostgres) {
      await queryRunner.query(`DROP TYPE "device_reading_type_enum"`);
    }
  }
}
