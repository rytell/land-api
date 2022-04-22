import { Module } from '@nestjs/common';
import { LandService } from './land.service';
import { LandController } from './land.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Land } from './land.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Land])],
  providers: [LandService],
  controllers: [LandController]
})
export class LandModule {}
