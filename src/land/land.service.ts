import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import { CreateLandDto } from './dto/create-land';
import { Land } from './land.entity';
import { SimulateClaimDto } from './dto/simulate-claim';
import { IRON, RADI, RPC_URL, STAKING_LAND, STONE, WHEAT, WOOD } from 'src/constants';
import * as stakeLandAbi from '../constants/abis/stakeLands.json';
import { SimulateLevelUpDto } from './dto/simulate-level-up';

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
            collection: createLandDto.collection.toString(),
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
            const landAPI = await this.getLandMetadata(createLandDto.landId, createLandDto.collection, createLandDto.staker);
            const heroType = await this.getHeroType(createLandDto.heroNumber);

            landAPI.staked = true;
            landAPI.lastStaked = new Date().toUTCString();
            landAPI.lastUnstaked = new Date().toUTCString();
            landAPI.hero_number = createLandDto.heroNumber;
            landAPI.hero_type = heroType;
            landAPI.staker = createLandDto.staker;
            return this.landsRepository.save(landAPI);
        }
    }

    async getLandMetadata(landId: number, collection: string, staker = ''): Promise<Land> {
        const landAttr: any = {};
        const collectionHash = this.getCollectionHash(collection);
        const response = await firstValueFrom(this.httpService.get(`https://rytell.mypinata.cloud/ipfs/${collectionHash}/${landId}.json`));

        response.data.attributes.forEach((attr) => {
            const attrName = attr.trait_type.toString().toLowerCase();
            const value = attr.value;
            landAttr[attrName] = value;
        });
        const land = new Land();
        land.land_id = landId;
        land.collection = collection;
        land.type = response.data.attributes[1].trait_type;
        land.resource_a = response.data.attributes[2].trait_type;
        land.resource_a_value = response.data.attributes[2].value;
        land.resource_b = response.data.attributes[3].trait_type;
        land.resource_b_value = response.data.attributes[3].value;
        land.image = response.data.image;
        land.staker = staker;
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
        const heroLands = await this.getHeroLands({
            owner: simulateClaimDto.owner,
            hero: simulateClaimDto.heroNumber,
        });
        let accumulatedIron = 0;
        let accumulatedStone = 0;
        let accumulatedWood = 0;
        let accumulatedWheat = 0;
        let accumulatedRadi = 0;
        await Promise.all(
            simulateClaimDto.lands.map(async (land) => {
                if (heroLands.filter((e) => +e.landId == land.landId && e.staked == true).length > 0) {
                    const landDB = await this.landsRepository.findOne({
                        land_id: land.landId,
                        collection: land.collection,
                    });
                    if (!landDB) {
                        const createLandDto = new CreateLandDto();
                        createLandDto.collection = land.collection;
                        createLandDto.heroNumber = simulateClaimDto.heroNumber;
                        createLandDto.landId = land.landId;
                        createLandDto.staker = simulateClaimDto.owner;
                        this.create(createLandDto);
                    }
                    try {
                        const firstResource = this.cleanLandResource(landDB.resource_a);
                        const secondResource = this.cleanLandResource(landDB.resource_b);
                        const firstResourceBasicEmission = this.getBasicEmission(firstResource, 1);
                        const secondResourceBasicEmission = this.getBasicEmission(secondResource, 1);
                        const heroFirstEmission = this.getHeroEmission(
                            landDB.hero_type,
                            landDB.type.toLowerCase(),
                            firstResourceBasicEmission,
                        );
                        const heroSecondEmission = this.getHeroEmission(
                            landDB.hero_type,
                            landDB.type.toLowerCase(),
                            secondResourceBasicEmission,
                        );
                        switch (firstResource) {
                            case 'iron':
                                accumulatedIron += heroFirstEmission;
                                break;
                            case 'stone':
                                accumulatedStone += heroFirstEmission;
                                break;
                            case 'wood':
                                accumulatedWood += heroFirstEmission;
                                break;
                            case 'wheat':
                                accumulatedWheat += heroFirstEmission;
                                break;
                            case 'radi':
                                accumulatedRadi += heroFirstEmission;
                                break;
                            default:
                                break;
                        }

                        switch (secondResource) {
                            case 'iron':
                                accumulatedIron += heroSecondEmission;
                                break;
                            case 'stone':
                                accumulatedStone += heroSecondEmission;
                                break;
                            case 'wood':
                                accumulatedWood += heroSecondEmission;
                                break;
                            case 'wheat':
                                accumulatedWheat += heroSecondEmission;
                                break;
                            case 'radi':
                                accumulatedRadi += heroSecondEmission;
                                break;
                            default:
                                break;
                        }
                    } catch (error) {
                        console.log(error);
                        throw 'One of the lands was not saved in our databases, please retry';
                    }
                }
            }),
        );
        let estimatedGas = 0;
        const chain = process.env.CHAIN || 43113;

        estimatedGas = await this.getMintResourceEstimation({
            to: simulateClaimDto.owner,
            amounts: [accumulatedIron, accumulatedStone, accumulatedWheat, accumulatedWood, accumulatedRadi],
            resources: [IRON[chain].address, STONE[chain].address, WHEAT[chain].address, WOOD[chain].address, RADI[chain].address],
        });

        return {
            accumulatedIron,
            accumulatedStone,
            accumulatedWood,
            accumulatedWheat,
            accumulatedRadi,
            estimatedGas,
        };
    }

    cleanLandResource(resource: string): string {
        const resourceItem = resource.split('-')[1].split(' ')[2].toLowerCase();
        return resourceItem;
    }

    async getHeroType(heroNumber: number): Promise<string> {
        const response = await firstValueFrom(
            this.httpService.get(`https://rytell.mypinata.cloud/ipfs/QmXHJfoMaDiRuzgkVSMkEsMgQNAtSKr13rtw5s59QoHJAm/${heroNumber}.json`),
        );
        const heroAttr: any = {};
        response.data.attributes.forEach((attr) => {
            const attrName = attr.trait_type.toString().toLowerCase();
            const value = attr.value;
            heroAttr[attrName] = value;
        });
        return heroAttr.character.toLowerCase();
    }

    getHeroEmission(heroType: string, land: string, basicEmission: number): number {
        const rawdata = fs.readFileSync('landsMetada.json');
        const herosLands = JSON.parse(rawdata.toString());
        const heroLands = herosLands[heroType];
        const heroLandEmission = basicEmission * +heroLands.lands[land] + basicEmission;
        return heroLandEmission;
    }

    async claim(): Promise<any> {}

    async simulateLevelUp(simulateLevelUpDto: SimulateLevelUpDto): Promise<any> {
        const heroType = await this.getHeroType(simulateLevelUpDto.heroNumber);
        const heroLands = await this.getHeroLands({
            owner: simulateLevelUpDto.owner,
            hero: simulateLevelUpDto.heroNumber,
        });
        let neededIron = 0;
        let neededStone = 0;
        let neededWood = 0;
        let neededWheat = 0;
        let neededRadi = 0;
        let coolDownHasPassed = true;
        await Promise.all(
            simulateLevelUpDto.lands.map(async (land) => {
                const heroLand = heroLands.find((_heroLand) => _heroLand.landId.toString() === land.landId.toString() && _heroLand.staked);
                if (heroLand) {
                    if (new Date().getTime() - +heroLand.lastLeveledUp * 1000 < 1000 * 60 * 60 * 24) {
                        coolDownHasPassed = false;
                    }
                    const nextLevel = +heroLand.level + 1;
                    if (nextLevel > 50) {
                        return;
                    }
                    const landAPI = await this.getLandMetadata(land.landId, land.collection);
                    const firstResource = this.cleanLandResource(landAPI.resource_a);
                    const secondResource = this.cleanLandResource(landAPI.resource_b);
                    const firstResourceBasicEmission = this.getBasicEmission(firstResource, +heroLand.level);
                    const secondResourceBasicEmission = this.getBasicEmission(secondResource, +heroLand.level);
                    const heroFirstEmission = this.getHeroEmission(heroType, landAPI.type.toLowerCase(), firstResourceBasicEmission);
                    const heroSecondEmission = this.getHeroEmission(heroType, landAPI.type.toLowerCase(), secondResourceBasicEmission);
                    switch (firstResource) {
                        case 'iron':
                            neededIron += heroFirstEmission * nextLevel;
                            break;
                        case 'stone':
                            neededStone += heroFirstEmission * nextLevel;
                            break;
                        case 'wood':
                            neededWood += heroFirstEmission * nextLevel;
                            break;
                        case 'wheat':
                            neededWheat += heroFirstEmission * nextLevel;
                            break;
                        default:
                            break;
                    }

                    switch (secondResource) {
                        case 'iron':
                            neededIron += heroSecondEmission * nextLevel;
                            break;
                        case 'stone':
                            neededStone += heroSecondEmission * nextLevel;
                            break;
                        case 'wood':
                            neededWood += heroSecondEmission * nextLevel;
                            break;
                        case 'wheat':
                            neededWheat += heroSecondEmission * nextLevel;
                            break;
                        default:
                            break;
                    }

                    neededRadi += 1000 * (+heroLand.level + 1);
                }
            }),
        );
        let estimatedGas = 0;
        const chain = process.env.CHAIN || 43113;

        estimatedGas = await this.getLevelUpEstimation({
            hero: simulateLevelUpDto.heroNumber,
            owner: simulateLevelUpDto.owner,
            whoPays: simulateLevelUpDto.owner,
            amounts: [neededIron, neededStone, neededWheat, neededWood, neededRadi],
            resources: [IRON[chain].address, STONE[chain].address, WHEAT[chain].address, WOOD[chain].address, RADI[chain].address],
        });

        const avaxProcessingFee = await this.getAvaxFeeFromGasUnits(estimatedGas);

        return {
            neededIron,
            neededRadi,
            neededStone,
            neededWheat,
            neededWood,
            estimatedGas,
            avaxProcessingFee,
            coolDownHasPassed,
        };
    }

    // async levelUp(levelUpDto: SimulateLevelUpDto): Promise<any> {
    //     try {
    //         const estimation = await this.simulateLevelUp(levelUpDto);
    //         const searchTx = async () => {
    //             const txs = await this.getAccountFromAPI();

    //             const tx = await txs?.result?.find?.((tx) => tx.hash.toLowerCase() === claimHeroDto.transactionHash.toLowerCase());

    //             return tx;
    //         };

    //         const tx = await this.retryCallbackTimes(searchTx, 15);

    //         if (!tx) {
    //             throw new HttpException('Tx Not Found', HttpStatus.NOT_FOUND);
    //         }

    //         const hero = await this.herosRepository.findOne({
    //             hero_number: claimHeroDto.heroNumber,
    //         });

    //         if (!hero) {
    //             throw new HttpException('Hero Not Found', HttpStatus.NOT_FOUND);
    //         }

    //         let claimTransaction = {};
    //         const claimTransactionDB = await this.claimTransactionsRepository.findOne({
    //             hash: claimHeroDto.transactionHash,
    //             redeemed: false,
    //         });
    //         if (claimTransactionDB) {
    //             claimTransaction = {
    //                 ...claimTransactionDB,
    //                 hash: claimHeroDto.transactionHash,
    //                 staker: hero.staker,
    //                 value: tx.value,
    //                 redeemed: false,
    //                 character: hero.hero_number,
    //                 radiValue: estimation.accumulated,
    //             };
    //         } else {
    //             claimTransaction = {
    //                 hash: claimHeroDto.transactionHash,
    //                 staker: hero.staker,
    //                 value: tx.value,
    //                 redeemed: false,
    //                 character: hero.hero_number,
    //                 radiValue: estimation.accumulated,
    //             };
    //         }
    //         try {
    //             const transactionDb = await this.claimTransactionsRepository.save(claimTransaction);

    //             // eslint-disable-next-line @typescript-eslint/no-var-requires
    //             const Web3 = require('web3');
    //             const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL[process.env.CHAIN]));

    //             const gasPrice = await web3.eth.getGasPrice();
    //             const fee = estimation.estimatedGas * gasPrice;
    //             const percentageDifference = Math.abs((fee - tx.value) / fee) * 100;

    //             if (percentageDifference > 15) {
    //                 throw new HttpException(
    //                     'Difference from payment and current estimation is too high for us to process the claim.',
    //                     HttpStatus.BAD_REQUEST,
    //                 );
    //             }

    //             const tryTransferRadi = async () => {
    //                 const radiContract = await getRadiContract();
    //                 const utils = web3Utils();
    //                 const address = process.env.GAME_EMISSIONS_FUND_ADDRESS;
    //                 try {
    //                     const transferTx = radiContract.methods.transfer(
    //                         transactionDb.staker,
    //                         utils.toWei(estimation.accumulated.toFixed(7).toString()),
    //                     );
    //                     try {
    //                         const gas = await transferTx.estimateGas({
    //                             from: address,
    //                         });
    //                         try {
    //                             const gasPrice = await web3.eth.getGasPrice();
    //                             const data = transferTx.encodeABI();
    //                             const nonce = await web3.eth.getTransactionCount(address);
    //                             const chainId = await web3.eth.net.getId();
    //                             const privateKey = process.env.PRIVATE_KEY;
    //                             const signedTx = await web3.eth.accounts.signTransaction(
    //                                 {
    //                                     to: radiContract.options.address,
    //                                     data,
    //                                     gas,
    //                                     gasPrice,
    //                                     nonce,
    //                                     chainId,
    //                                 },
    //                                 privateKey,
    //                             );

    //                             await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    //                         } catch (error) {
    //                             sendError(JSON.stringify({ error, claimHeroDto }));
    //                             throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    //                         }
    //                     } catch (error) {
    //                         sendError(JSON.stringify({ error, claimHeroDto }));
    //                         throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    //                     }

    //                     transactionDb.redeemed = true;
    //                     await this.claimTransactionsRepository.save(transactionDb);
    //                     hero.lastClaim = new Date().getTime().toString();
    //                     this.herosRepository.save(hero);
    //                 } catch (error) {
    //                     sendError(JSON.stringify({ error, claimHeroDto }));
    //                     throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    //                 }
    //             };

    //             await tryTransferRadi();

    //             return {
    //                 estimation,
    //                 tx,
    //                 fee,
    //                 percentageDifference,
    //                 redeemed: transactionDb.redeemed,
    //             };
    //         } catch (error) {
    //             throw new HttpException("Transaction could'nt be saved", HttpStatus.BAD_REQUEST);
    //         }
    //     } catch (error) {
    //         sendError(JSON.stringify({ error, claimHeroDto }));
    //         throw new HttpException('Unexpected', HttpStatus.INTERNAL_SERVER_ERROR);
    //     }
    // }

    async getStakeLandContract() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Web3 = require('web3');
        const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL[process.env.CHAIN]));
        const stakeLandsContract = new web3.eth.Contract(stakeLandAbi, STAKING_LAND[process.env.CHAIN || 43113]);

        return stakeLandsContract;
    }

    async getAvaxFeeFromGasUnits(gasUnits: number) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Web3 = require('web3');
        const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL[process.env.CHAIN]));

        const gasPrice = await web3.eth.getGasPrice();
        return gasUnits * gasPrice;
    }

    getCollectionHash(id: string): string {
        const rawdata = fs.readFileSync('collections.json');
        const collections = JSON.parse(rawdata.toString());
        return collections[id].hash;
    }

    getBasicEmission(resource: string, level: number): number {
        const rawdata = fs.readFileSync('basicEmissions.json');
        const basicEmissions = JSON.parse(rawdata.toString());
        return +basicEmissions[resource][level - 1];
    }

    test(): any {
        return '';
    }

    async getHeroLands({ owner, hero }: { owner: string; hero: number }): Promise<
        {
            landId: string;
            collection: string;
            staked: boolean;
            level: string;
            lastLeveledUp: string;
        }[]
    > {
        const stakeLandsContract = await this.getStakeLandContract();
        const lands = [];
        let index = 0;
        while (true) {
            try {
                const rawResponse: {
                    landId: string;
                    collection: string;
                    staked: boolean;
                    level: string;
                    heroId: string;
                } = await stakeLandsContract.methods.stakedLands(owner, index).call();
                if (+rawResponse.heroId === hero) {
                    lands.push(rawResponse);
                }
            } catch (error) {
                break;
            }
            index++;
        }
        return lands;
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

    async getMintResourceEstimation({ to, amounts, resources }: { to: string; amounts: number[]; resources: string[] }) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Web3 = require('web3');
        const stakeLandContract = await this.getStakeLandContract();
        const utils = Web3.utils;
        const estimation = await stakeLandContract.methods
            .mintResources(
                resources,
                amounts.map((amount) => utils.toWei(amount.toFixed(7).toString())),
                to,
            )
            .estimateGas({
                from: process.env.DEPLOYER,
            });
        return estimation * 1.2;
    }

    async getLevelUpEstimation({
        amounts,
        resources,
        hero,
        whoPays,
        owner,
    }: {
        amounts: number[];
        resources: string[];
        hero: number;
        whoPays: string;
        owner: string;
    }) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Web3 = require('web3');
        const stakeLandContract = await this.getStakeLandContract();
        const utils = Web3.utils;
        console.log(
            resources,
            amounts.map((amount) => utils.toWei(amount.toString())),
            hero,
            whoPays,
            owner,
        );
        const estimation = await stakeLandContract.methods
            .levelHeroLandsUp(
                resources,
                amounts.map((amount) => utils.toWei(amount.toString())),
                hero,
                whoPays,
                owner,
            )
            .estimateGas({
                from: process.env.DEPLOYER,
            });
        return estimation * 1.2;
    }

    async getAccountFromAPI(): Promise<any> {
        const snowtraceAPIBaseUrl = process.env.SNOWTRACEBASEURL;
        const response = await firstValueFrom(
            this.httpService.get(
                `${snowtraceAPIBaseUrl}/api?module=account&action=txlist&address=${process.env.GAME_EMISSIONS_FUND_ADDRESS}&startblock=1&endblock=99999999&sort=desc`,
            ),
        );

        return response.data;
    }
}
