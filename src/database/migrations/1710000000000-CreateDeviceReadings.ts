import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeviceReadings1710000000000 implements MigrationInterface {
  name = 'CreateDeviceReadings1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se é PostgreSQL para usar enum
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (isPostgres) {
      // Verificar se o enum já existe
      const enumExists = await queryRunner.query(`
        SELECT 1 FROM pg_type WHERE typname = 'device_reading_type_enum'
      `);

      if (!enumExists || enumExists.length === 0) {
        // Criar o tipo enum no PostgreSQL
        await queryRunner.query(`
          CREATE TYPE "device_reading_type_enum" AS ENUM('VOLTAGE', 'CURRENT', 'TEMPERATURE')
        `);
      }

      // Verificar se a tabela já existe
      const tableExists = await queryRunner.query(`
        SELECT 1 FROM information_schema.tables WHERE table_name = 'device_readings'
      `);

      if (!tableExists || tableExists.length === 0) {
        // Criar a tabela com enum
        await queryRunner.query(`
          CREATE TABLE "device_readings" (
            "id" SERIAL NOT NULL,
            "type" "device_reading_type_enum" NOT NULL,
            "value" NUMERIC(10,2) NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_device_readings" PRIMARY KEY ("id")
          )
        `);
      }
    } else {
      // Para outros bancos (SQLite), usar varchar
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "device_readings" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('VOLTAGE', 'CURRENT', 'TEMPERATURE')),
          "value" DECIMAL(10,2) NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Criar índices se não existirem
    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_device_readings_type" ON "device_readings" ("type")
      `);
    } catch (error) {}

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_device_readings_created_at" ON "device_readings" ("createdAt")
      `);
    } catch (error) {}
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
