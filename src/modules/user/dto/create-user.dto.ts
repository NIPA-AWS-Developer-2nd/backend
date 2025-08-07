import { IsString, IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '../../../entities';

export class CreateUserDto {
  @IsString()
  phoneNumber: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
