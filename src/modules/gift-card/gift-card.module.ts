import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCardService } from './gift-card.service';
import { GiftCardController } from './gift-card.controller';
import { GiftCard } from '../../entities/gift-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GiftCard])],
  controllers: [GiftCardController],
  providers: [GiftCardService],
  exports: [GiftCardService],
})
export class GiftCardModule {}