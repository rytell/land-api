import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import { CreateLandDto } from './dto/create-land';
import { Land } from './land.entity';
import { SimulateClaimDto } from './dto/simulate-claim';
import { RPC_URL, STAKING_LAND } from 'src/constants';
import * as stakeLandAbi from '../constants/abis/stakeLands.json';

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
            collection: 'collection1',
        });

        if (landDB) {
            if (landDB?.lastStaked < '1' || landDB?.lastUnstaked < '1') {
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
        const collectionHash = this.getCollectionHash(createLandDto.collection);
        const response = await firstValueFrom(
            this.httpService.get(
                `https://rytell.mypinata.cloud/ipfs/${collectionHash}/${createLandDto.landId}.json`,
            ),
        );

        response.data.attributes.forEach((attr) => {
            const attrName = attr.trait_type.toString().toLowerCase();
            const value = attr.value;
            landAttr[attrName] = value;
        });
        const land = new Land();
        land.land_id = createLandDto.landId;
        land.collection = 'collection1';
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

    async simulateClaim(simulateClaimDto: SimulateClaimDto): Promise<any> {
        const heroTypeAndLand = await this.getHeroTypeAndLand(simulateClaimDto.hero)
        let lands: Land[] = [];
        let accumulatedIron = 0;
        let accumulatedStone = 0;
        let accumulatedWood = 0;
        let accumulatedWheat = 0;
        simulateClaimDto.lands.forEach(async land => {
            const landDB = await this.landsRepository.findOne({
                land_id: land.landId,
                collection: land.collection,
            });
            const firstResource = this.cleanLandResource(landDB.resource_a)
            const secondResource = this.cleanLandResource(landDB.resource_b)
            const firstResourceBasicEmission = this.getBasicEmission(firstResource, 1)
            const secondResourceBasicEmission = this.getBasicEmission(secondResource, 1)
            const heroFirstEmission = this.getHeroEmission(heroTypeAndLand, firstResourceBasicEmission);
            const heroSecondEmission = this.getHeroEmission(heroTypeAndLand, secondResourceBasicEmission);
            console.log(firstResource, heroFirstEmission)
            console.log(secondResource, heroSecondEmission)
        });


        let estimatedGas = 0;
        return simulateClaimDto;
    }

    cleanLandResource(resource: string): string{
        const resourceItem = resource.split('-')[1].split(' ')[2].toLowerCase()
        return resourceItem
    }

    async getHeroTypeAndLand(heroNumber: number): Promise<[string,string]>{
        const response = await firstValueFrom(
            this.httpService.get(
                `https://rytell.mypinata.cloud/ipfs/QmXHJfoMaDiRuzgkVSMkEsMgQNAtSKr13rtw5s59QoHJAm/${heroNumber}.json`,
            ),
        );
        const heroAttr: any = {};
        response.data.attributes.forEach((attr) => {
            const attrName = attr.trait_type.toString().toLowerCase();
            const value = attr.value;
            heroAttr[attrName] = value;
        });
        return [heroAttr.character.toLowerCase(), heroAttr.background.toLowerCase()];
    }

    getHeroEmission(heroTypeAndLand: [string, string], basicEmission: number): number {
        const rawdata = fs.readFileSync('landsMetada.json');
        const herosLands = JSON.parse(rawdata.toString());
        const heroLands = herosLands[heroTypeAndLand[0]]
        const heroLandEmission = (basicEmission * +heroLands.lands[heroTypeAndLand[1]]) + basicEmission
        return heroLandEmission;
    }

    async claim(): Promise<any> {}

    async simulateLevelUp(simulateClaimDto: SimulateClaimDto): Promise<any> {
        let lands: Land[] = [];
        let accumulatedIron = 0;
        let accumulatedStone = 0;
        let accumulatedWood = 0;
        let accumulatedWheat = 0;

        let estimatedGas = 0;
    }

    async levelUp(): Promise<any> {}

    async getStakeLandContract() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Web3 = require('web3');
        const web3 = new Web3(
            new Web3.providers.HttpProvider(RPC_URL[process.env.CHAIN]),
        );
        const stakeLandsContract = new web3.eth.Contract(
            stakeLandAbi,
            STAKING_LAND[process.env.CHAIN || 43113],
        );

        return stakeLandsContract;
    }

    getCollectionHash(id: number): string {
        const rawdata = fs.readFileSync('collections.json');
        const collections = JSON.parse(rawdata.toString());
        return collections[id].hash;
    }

    getBasicEmission(resource: string, level: number): number {
        const rawdata = fs.readFileSync('basicEmissions.json');
        const basicEmissions = JSON.parse(rawdata.toString());
        return +basicEmissions[resource][level-1];
    }

    test(): any {
        return '';
    }

    async getHeroLands({
        owner,
        hero,
    }: {
        owner: string;
        hero: number;
    }): Promise<any[]> {
        const stakeLandsContract = await this.getStakeLandContract();
        const rawResponse: any = await stakeLandsContract.methods
            .getHeroLands(owner, hero)
            .call({ from: process.env.GAME_EMISSIONS_FUND_ADDRESS });
        const keys = ['landId', 'collection', 'staked', 'level'];
        const heroLands = [];
        for (let index = 0; index < rawResponse[0].length; index++) {
            const base = {};
            for (let innerIndex = 0; innerIndex < keys.length; innerIndex++) {
                base[`${keys[innerIndex]}`] = rawResponse[innerIndex][index];
            }
            heroLands.push(base);
        }
        return heroLands;
    }

    async getStakedHeros({ owner }: { owner: string }): Promise<any> {
        const stakeLandsContract = await this.getStakeLandContract();
        const heros = [];
        let index = 0;
        while (true) {
            try {
                const rawResponse: any = await stakeLandsContract.methods
                    .stakedHeros(owner, index)
                    .call({ from: process.env.GAME_EMISSIONS_FUND_ADDRESS });
                index++;
                heros.push(rawResponse);
            } catch (error) {
                console.log(error);
                break;
            }
        }
        return heros;
    }

    async getStakedLands({ owner }: { owner: string }): Promise<any> {
        const stakeLandsContract = await this.getStakeLandContract();
        const heros = [];
        let index = 0;
        while (true) {
            try {
                const rawResponse: any = await stakeLandsContract.methods
                    .stakedLands(owner, index)
                    .call({ from: process.env.GAME_EMISSIONS_FUND_ADDRESS });
                index++;
                heros.push(rawResponse);
            } catch (error) {
                console.log(error);
                break;
            }
        }
        return heros;
    }

    async getMintResourceEstimation({
        to,
        amounts,
        resources,
    }: {
        to: string;
        amounts: number[];
        resources: string[];
    }) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Web3 = require('web3');
        const stakeLandContract = await this.getStakeLandContract();
        const utils = Web3.utils;
        const estimation = await stakeLandContract.methods
            .mintResources(
                resources,
                amounts.map((amount) =>
                    utils.toWei(amount.toFixed(7).toString()),
                ),
                to,
            )
            .estimateGas({
                from: process.env.GAME_EMISSIONS_FUND_ADDRESS,
            });
        return estimation * 1.2;
    }
}
