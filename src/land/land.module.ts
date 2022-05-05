import { Module } from '@nestjs/common';
import { LandService } from './land.service';
import { LandController } from './land.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Land } from './land.entity';
import { GeneralTransaction } from './general-transaction.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Land, GeneralTransaction]), HttpModule],
    providers: [LandService],
    controllers: [LandController],
})
export class LandModule {}
