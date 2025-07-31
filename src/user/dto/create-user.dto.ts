import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자의 이름',
    required: true,
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '사용자 이메일 주소',
    required: true,
    example: 'hong@example.com',
  })
  email: string;
}
