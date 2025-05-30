import { ApiProperty } from '@nestjs/swagger';

export class ModbusStatusPresenter {
  @ApiProperty({
    description: 'Status atual da conexão',
    type: String,
    example: 'connected',
  })
  status: string;

  @ApiProperty({
    description: 'Mensagem de erro, se houver',
    type: String,
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Detalhes adicionais sobre o status ou erro',
    type: String,
    required: false,
  })
  details?: string;
}
