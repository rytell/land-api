import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLandDto } from './dto/create-land';
import { Land } from './land.entity';

@Injectable()
export class LandService {
    constructor(
        @InjectRepository(Land)
        private readonly landsRepository: Repository<Land>,
    ) {}

    async create(createLandDto: CreateLandDto): Promise<Land> | undefined {
        const land = new Land();
        land.land_id = createLandDto.landId;
        land.collection = "collection1";
        land.image = "imagen1";
        land.name = "name1";
        land.rarity = 100;
        land.character = "character1";
        land.tier = 3;
        land.title = "title1";
        land.strength = 101;
        land.background = "background1";
        land.cunning = 102;
        land.will = 103;
        land.hero_number = 2020;
        land.staked = true;
        land.staker = createLandDto.staker;
        land.lastClaim = "";
        land.lastStaked= "";
        land.lastUnstaked = "";
        return this.landsRepository.save(land);
    }
}
