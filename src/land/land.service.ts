import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { CreateLandDto } from './dto/create-land';
import { Land } from './land.entity';

@Injectable()
export class LandService {
    constructor(
        @InjectRepository(Land)
        private readonly landsRepository: Repository<Land>,
        private httpService: HttpService,
    ) {}

    async create(createLandDto: CreateLandDto): Promise<Land> | undefined {

        const validateErrors = this.validateLandDTO(createLandDto);
        if (validateErrors.length > 0) {
            throw validateErrors;
        }

        const landDB = await this.landsRepository.findOne({
            land_id: createLandDto.landId,
            collection: "collection1"
        });

        if (landDB) {
            if (
                landDB?.lastStaked < "1" ||
                landDB?.lastUnstaked < "1"
            ) {
                const land: Land = {
                    ...landDB,
                    staked: false,
                    staker: createLandDto.staker,
                    lastStaked: new Date().toUTCString(),
                    lastUnstaked: new Date().toUTCString(),
                    updated_at: new Date(new Date().toUTCString()),
                };
                return this.landsRepository.save(land);
            } else {
                return landDB;
            }
        } else {
            const landAPI = await this.getLandMetadata(createLandDto);

            landAPI.staked = true;
            landAPI.lastStaked = new Date().toUTCString();
            landAPI.lastUnstaked = new Date().toUTCString();
            landAPI.hero_number = 4566;
            landAPI.staker = createLandDto.staker;
            return this.landsRepository.save(landAPI);
        }
    }

    async getLandMetadata(createLandDto: CreateLandDto): Promise<Land> {
        const landAttr: any = {};
        const response = await firstValueFrom(
            this.httpService.get(
                `https://rytell.mypinata.cloud/ipfs/QmbP1NySANMBLLj9qniEXtgPxoA8E3B5EkhuF2BQcHMJwj/${createLandDto.landId}.json`,
            ),
        );

        response.data.attributes.forEach((attr) => {
            const attrName = attr.trait_type.toString().toLowerCase();
            const value = attr.value;
            landAttr[attrName] = value;
        });
        const land = new Land();
        land.land_id = createLandDto.landId;
        land.collection = "collection1";
        land.type = response.data.attributes[1].trait_type;
        land.resource_a = response.data.attributes[2].trait_type;
        land.resource_a_value = response.data.attributes[2].value;
        land.resource_b = response.data.attributes[3].trait_type;
        land.resource_b_value = response.data.attributes[3].value;
        land.image = response.data.image;
        land.staker = createLandDto.staker;
        return land;
    }

    validateLandDTO(createLandDto: CreateLandDto): string {
        if (createLandDto.landId != null) {
            if (+createLandDto.landId === 0) {
                return 'Error, landId required';
            }
        } else {
            return 'Error, landId required';
        }

        if (createLandDto.staker != null) {
            if (createLandDto.staker?.trim() === '') {
                return 'Error, staker required';
            }
        } else {
            return 'Error, staker required';
        }
        return '';
    }
}