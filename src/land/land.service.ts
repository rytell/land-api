import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import { CreateLandDto } from './dto/create-land';
import { Land } from './land.entity';
import { Land as LandDto } from './dto/claim-land';
import { ClaimLandDto } from './dto/claim-land';
import { IRON, LandContract, RADI, RPC_URL, SNOWTRACE, STAKING_LAND, STONE, WHEAT, WOOD } from 'src/constants';
import * as stakeLandAbi from '../constants/abis/stakeLands.json';
import { SimulateLevelUpDto } from './dto/simulate-level-up';
import { LevelUpDto } from './dto/level-up';
import { GeneralTransaction } from './general-transaction.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');
import BN from 'bn.js';

interface LevelUpEstimation {
    neededIron: number;
    neededRadi: number;
    onlyRadi: number;
    neededStone: number;
    neededWheat: number;
    neededWood: number;
    estimatedGas: number;
    avaxProcessingFee: number; // hardcoded 0.1 AVAX for testing purposes
    coolDownHasPassed: boolean;
}

const chain = process.env.CHAIN || 43113;
@Injectable()
export class LandService {
    constructor(
        @InjectRepository(Land)
        private readonly landsRepository: Repository<Land>,
        @InjectRepository(GeneralTransaction)
        private readonly transactionsRepository: Repository<GeneralTransaction>,
        private httpService: HttpService,
    ) {}

    async create(createLandDto: CreateLandDto): Promise<Land> | undefined {
        const validateErrors = this.validateLandDTO(createLandDto);
        if (validateErrors.length > 0) {
            throw validateErrors;
        }
        const landAPI = await this.getLandMetadata(createLandDto.landId, createLandDto.collection, createLandDto.staker);
        const heroType = await this.getHeroType(createLandDto.heroNumber);
        landAPI.hero_number = createLandDto.heroNumber;
        landAPI.hero_type = heroType;
        landAPI.staker = createLandDto.staker;
        return this.landsRepository.save(landAPI);
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

    async simulateClaim(simulateClaimDto: ClaimLandDto): Promise<any> {
        const heroLands = await this.getHeroLands({
            owner: simulateClaimDto.owner,
            hero: +simulateClaimDto.heroNumber,
        });
        let accumulatedIron = 0;
        let accumulatedStone = 0;
        let accumulatedWood = 0;
        let accumulatedWheat = 0;
        let accumulatedRadi = 0;
        await Promise.all(
            simulateClaimDto.lands.map(async (land) => {
                const heroLand = heroLands.find((_heroLand) => _heroLand.landId.toString() === land.landId.toString() && _heroLand.staked);
                if (heroLand) {
                    let landDB = await this.landsRepository.findOne({
                        land_id: land.landId,
                        collection: land.collection,
                    });
                    if (!landDB) {
                        const createLandDto = new CreateLandDto();
                        createLandDto.collection = land.collection;
                        createLandDto.heroNumber = simulateClaimDto.heroNumber;
                        createLandDto.landId = land.landId;
                        createLandDto.staker = simulateClaimDto.owner;
                        landDB = await this.create(createLandDto);
                    }
                    try {
                        const lastStaked = heroLand.lastStaked + '000';
                        const currentDate = lastStaked > landDB.lastClaim ? lastStaked : landDB.lastClaim;
                        const daysDifference = this.daysDifference(new Date(), new Date(+currentDate));
                        const firstResource = this.cleanLandResource(landDB.resource_a);
                        const secondResource = this.cleanLandResource(landDB.resource_b);
                        const firstResourceBasicEmission = this.getBasicEmission(firstResource, +heroLand.level);
                        const secondResourceBasicEmission = this.getBasicEmission(secondResource, +heroLand.level);
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
                                accumulatedIron += heroFirstEmission * daysDifference;
                                break;
                            case 'stone':
                                accumulatedStone += heroFirstEmission * daysDifference;
                                break;
                            case 'wood':
                                accumulatedWood += heroFirstEmission * daysDifference;
                                break;
                            case 'wheat':
                                accumulatedWheat += heroFirstEmission * daysDifference;
                                break;
                            case 'radi':
                                accumulatedRadi += heroFirstEmission * daysDifference;
                                break;
                            default:
                                break;
                        }

                        switch (secondResource) {
                            case 'iron':
                                accumulatedIron += heroSecondEmission * daysDifference;
                                break;
                            case 'stone':
                                accumulatedStone += heroSecondEmission * daysDifference;
                                break;
                            case 'wood':
                                accumulatedWood += heroSecondEmission * daysDifference;
                                break;
                            case 'wheat':
                                accumulatedWheat += heroSecondEmission * daysDifference;
                                break;
                            case 'radi':
                                accumulatedRadi += heroSecondEmission * daysDifference;
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

        estimatedGas = await this.getMintResourceEstimation({
            to: simulateClaimDto.owner,
            amounts: [accumulatedIron, accumulatedStone, accumulatedWheat, accumulatedWood, accumulatedRadi],
            resources: [IRON[chain].address, STONE[chain].address, WHEAT[chain].address, WOOD[chain].address, RADI[chain].address],
        });

        const avaxProcessingFee = await this.getAvaxFeeFromGasUnits(estimatedGas);

        return {
            accumulatedIron,
            accumulatedStone,
            accumulatedWood,
            accumulatedWheat,
            accumulatedRadi,
            estimatedGas,
            avaxProcessingFee,
        };
    }

    daysDifference(date1, date2): number {
        const difference = date1.getTime() - date2.getTime();

        const daysDifference = Math.floor(difference / (1000 * 3600 * 24));
        return daysDifference;
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

    validateClaimTransactionDTO(claimTransactionDto: ClaimLandDto) {
        const errors = claimTransactionDto.lands.map((land) => {
            if (land.landId != null) {
                if (+land.landId === 0) {
                    throw 'Error, landId required';
                }
            } else {
                throw 'Error, landId required';
            }

            if (claimTransactionDto.transactionHash != null) {
                if (claimTransactionDto.transactionHash?.trim() === '') {
                    throw 'Error, hash required';
                }
            } else {
                throw 'Error, hash required';
            }

            return '';
        });
    }

    async claim(claimLandDto: ClaimLandDto): Promise<any> {
        this.validateClaimTransactionDTO(claimLandDto);
        try {
            const resourcesToClaim = await this.simulateClaim(claimLandDto);
            const searchTx = async () => {
                const txs = await this.getAccountFromAPI();

                const tx = await txs?.result?.find?.((tx) => tx.hash.toLowerCase() === claimLandDto.transactionHash.toLowerCase());
                return tx;
            };

            const tx = await this.retryCallbackTimes(searchTx, 15);
            if (!tx) {
                throw new HttpException('Tx Not Found', HttpStatus.NOT_FOUND);
            }

            let claimTransaction = {};
            const claimTransactionDB = await this.transactionsRepository.findOne({
                hash: claimLandDto.transactionHash,
                redeemed: false,
            });
            if (claimTransactionDB) {
                claimTransaction = {
                    ...claimTransactionDB,
                    hash: claimLandDto.transactionHash,
                    staker: claimLandDto.owner,
                    value: tx.value,
                    redeemed: false,
                    character: claimLandDto.heroNumber,
                    ironValue: resourcesToClaim.accumulatedIron,
                    stoneValue: resourcesToClaim.accumulatedStone,
                    woodValue: resourcesToClaim.accumulatedWood,
                    wheatValue: resourcesToClaim.accumulatedWheat,
                    radiValue: resourcesToClaim.accumulatedRadi,
                };
            } else {
                claimTransaction = {
                    hash: claimLandDto.transactionHash,
                    staker: claimLandDto.owner,
                    value: tx.value,
                    redeemed: false,
                    transactionType: 'claim',
                    character: claimLandDto.heroNumber,
                    ironValue: resourcesToClaim.accumulatedIron,
                    stoneValue: resourcesToClaim.accumulatedStone,
                    woodValue: resourcesToClaim.accumulatedWood,
                    wheatValue: resourcesToClaim.accumulatedWheat,
                    radiValue: resourcesToClaim.accumulatedRadi,
                };
            }

            try {
                const transactionDb = await this.transactionsRepository.save(claimTransaction);

                const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL[chain]));
                const gasPrice = await web3.eth.getGasPrice();
                const fee = resourcesToClaim.estimatedGas * gasPrice;
                const percentageDifference = Math.abs((fee - tx.value) / fee) * 100;

                if (percentageDifference > 15) {
                    throw new HttpException(
                        'Difference from payment and current estimation is too high for us to process the claim.',
                        HttpStatus.BAD_REQUEST,
                    );
                }

                const tryMintResources = async () => {
                    const stakeLandContract = await this.getStakeLandContract();
                    const utils = Web3.utils;

                    const address = process.env.DEPLOYER; // INSUFFICIENT ALLOWANCE
                    const resourceInWei = (amount: number) => utils.toWei(amount.toString());
                    try {
                        const mintTransaction = stakeLandContract.methods.mintResources(
                            [IRON[chain].address, STONE[chain].address, WOOD[chain].address, WHEAT[chain].address, RADI[chain].address],
                            [
                                resourceInWei(resourcesToClaim.accumulatedIron),
                                resourceInWei(resourcesToClaim.accumulatedStone),
                                resourceInWei(resourcesToClaim.accumulatedWood),
                                resourceInWei(resourcesToClaim.accumulatedWheat),
                                resourceInWei(resourcesToClaim.accumulatedRadi),
                            ],
                            claimLandDto.owner,
                        );
                        try {
                            const gas = await mintTransaction.estimateGas({
                                from: address,
                            });
                            try {
                                const gasPrice = await web3.eth.getGasPrice();
                                const data = mintTransaction.encodeABI();
                                const nonce = await web3.eth.getTransactionCount(address);
                                const chainId = await web3.eth.net.getId();
                                const privateKey = process.env.DEPLOYER_PK; // TODO key deployer
                                const signedTx = await web3.eth.accounts.signTransaction(
                                    {
                                        to: stakeLandContract.options.address,
                                        data,
                                        gas,
                                        gasPrice,
                                        nonce,
                                        chainId,
                                    },
                                    privateKey,
                                );

                                await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                            } catch (error) {
                                // sendError(
                                //     JSON.stringify({ error, claimHeroDto }),
                                // );
                                throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                        } catch (error) {
                            // sendError(JSON.stringify({ error, claimHeroDto }));
                            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
                        }

                        transactionDb.redeemed = true;
                        await this.transactionsRepository.save(transactionDb);
                        claimLandDto.lands.map(async (land) => {
                            const landDB = await this.landsRepository.findOne({
                                land_id: land.landId,
                                collection: land.collection,
                            });
                            landDB.lastClaim = new Date().getTime().toString();
                            this.landsRepository.save(landDB);
                        });
                    } catch (error) {
                        // sendError(JSON.stringify({ error, claimHeroDto }));
                        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
                    }
                };

                await tryMintResources();

                return {
                    resourcesToClaim,
                    tx,
                    fee,
                    percentageDifference,
                    redeemed: transactionDb.redeemed,
                };
            } catch {
                throw new HttpException("Transaction could'nt be saved", HttpStatus.BAD_REQUEST);
            }
        } catch (error) {
            throw error;
        }
    }

    async getAccountFromAPI(): Promise<any> {
        const snowtraceAPIBaseUrl = SNOWTRACE[chain];
        const response = await firstValueFrom(
            this.httpService.get(
                `${snowtraceAPIBaseUrl}/api?module=account&action=txlist&address=${process.env.DEPLOYER}&startblock=1&endblock=99999999&sort=desc`,
            ),
        );

        return response.data;
    }

    async retryCallbackTimes(callback: any, times: number) {
        if (times > 0) {
            const result = await callback();
            if (result) {
                return result;
            } else {
                console.log('trying again: ', times);
                return await this.retryCallbackTimes(callback, --times);
            }
        } else {
            return undefined;
        }
    }

    async simulateLevelUp(simulateLevelUpDto: SimulateLevelUpDto): Promise<LevelUpEstimation> {
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
        let onlyRadi = 0;
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
                        case 'radi':
                            neededRadi += heroFirstEmission * nextLevel;
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
                        case 'radi':
                            neededRadi += heroSecondEmission * nextLevel;
                        default:
                            break;
                    }

                    onlyRadi += 1000 * (+heroLand.level + 1);
                }
            }),
        );
        let estimatedGas = 0;
        const chain = process.env.CHAIN || 43113;

        estimatedGas = await this.getLevelUpEstimation({
            hero: simulateLevelUpDto.heroNumber,
            owner: simulateLevelUpDto.owner,
            whoPays: process.env.DEPLOYER, // in purpose of letting anyone estimate how much is needed to level up
            amounts: [neededIron, neededStone, neededWheat, neededWood, onlyRadi],
            resources: [IRON[chain].address, STONE[chain].address, WHEAT[chain].address, WOOD[chain].address, RADI[chain].address],
        });

        const avaxProcessingFee = await this.getAvaxFeeFromGasUnits(estimatedGas);

        return {
            neededIron,
            neededRadi,
            neededStone,
            neededWheat,
            neededWood,
            onlyRadi,
            estimatedGas,
            avaxProcessingFee,
            coolDownHasPassed,
        };
    }

    async levelUp(levelUpDto: LevelUpDto): Promise<any> {
        try {
            const estimation = await this.simulateLevelUp(levelUpDto);

            // did user pay gas?
            const searchTx = async () => {
                const txs = await this.getAccountFromAPI();

                const tx = await txs?.result?.find?.((tx) => tx.hash.toLowerCase() === levelUpDto.transactionHash.toLowerCase());

                return tx;
            };

            const tx = await this.retryCallbackTimes(searchTx, 15);

            if (!tx) {
                throw new HttpException('Tx Not Found', HttpStatus.NOT_FOUND);
            }

            let levelUpTransaction = {};
            const levelUpTransactionDb = await this.transactionsRepository.findOne({
                hash: levelUpDto.transactionHash,
                redeemed: false,
            });
            const baseTxObject = {
                hash: levelUpDto.transactionHash,
                staker: levelUpDto.owner,
                value: tx.value,
                redeemed: false,
                character: levelUpDto.heroNumber,
                radiValue: levelUpDto.onlyRadi ? estimation.onlyRadi : estimation.neededRadi,
                ironValue: levelUpDto.onlyRadi ? 0 : estimation.neededIron,
                stoneValue: levelUpDto.onlyRadi ? 0 : estimation.neededStone,
                woodValue: levelUpDto.onlyRadi ? 0 : estimation.neededWood,
                wheatValue: levelUpDto.onlyRadi ? 0 : estimation.neededWheat,
            };
            if (levelUpTransactionDb) {
                levelUpTransaction = {
                    ...levelUpTransactionDb,
                    ...baseTxObject,
                };
            } else {
                levelUpTransaction = {
                    ...baseTxObject,
                    type: 'LEVEL_UP',
                };
            }
            try {
                const transactionDb = await this.transactionsRepository.save(levelUpTransaction);

                const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL[process.env.CHAIN]));

                const gasPrice = await web3.eth.getGasPrice();
                const fee = estimation.estimatedGas * gasPrice;
                const percentageDifference = Math.abs((fee - tx.value) / fee) * 100;

                if (percentageDifference > 15) {
                    throw new HttpException(
                        'Difference from payment and current estimation is too high for us to process the level up.',
                        HttpStatus.BAD_REQUEST,
                    );
                }

                const tryLevelUp = async () => {
                    const stakeLandsContract = await this.getStakeLandContract();
                    const utils = Web3.utils;
                    const address = process.env.GAME_EMISSIONS_FUND_ADDRESS;

                    const resourceInWei = (amount: number) => utils.toWei(amount.toString());
                    const chain = process.env.CHAIN || 43113;

                    try {
                        const levelUpTx = stakeLandsContract.methods.levelHeroLandsUp(
                            [IRON[chain].address, STONE[chain].address, WOOD[chain].address, WHEAT[chain].address, RADI[chain].address],
                            [
                                resourceInWei(levelUpDto.onlyRadi ? 0 : estimation.neededIron),
                                resourceInWei(levelUpDto.onlyRadi ? 0 : estimation.neededStone),
                                resourceInWei(levelUpDto.onlyRadi ? 0 : estimation.neededWood),
                                resourceInWei(levelUpDto.onlyRadi ? 0 : estimation.neededWheat),
                                resourceInWei(levelUpDto.onlyRadi ? estimation.onlyRadi : estimation.neededRadi),
                            ],
                        );
                        try {
                            const gas = await levelUpTx.estimateGas({
                                from: address,
                            });
                            try {
                                const gasPrice = await web3.eth.getGasPrice();
                                const data = levelUpTx.encodeABI();
                                const nonce = await web3.eth.getTransactionCount(address);
                                const chainId = await web3.eth.net.getId();
                                const privateKey = process.env.PRIVATE_KEY;
                                const signedTx = await web3.eth.accounts.signTransaction(
                                    {
                                        to: stakeLandsContract.options.address,
                                        data,
                                        gas,
                                        gasPrice,
                                        nonce,
                                        chainId,
                                    },
                                    privateKey,
                                );

                                await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                            } catch (error) {
                                // sendError(JSON.stringify({ error, claimHeroDto }));
                                throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                        } catch (error) {
                            // sendError(JSON.stringify({ error, claimHeroDto }));
                            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
                        }

                        transactionDb.redeemed = true;
                        await this.transactionsRepository.save(transactionDb);

                        await this.markLastClaimOnLands(levelUpDto.lands);
                    } catch (error) {
                        // sendError(JSON.stringify({ error, claimHeroDto }));
                        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
                    }
                };

                await tryLevelUp();

                return {
                    estimation,
                    tx,
                    fee,
                    percentageDifference,
                    redeemed: transactionDb.redeemed,
                };
            } catch (error) {
                throw new HttpException("Transaction could'nt be saved", HttpStatus.BAD_REQUEST);
            }
        } catch (error) {
            // sendError(JSON.stringify({ error, claimHeroDto }));
            throw new HttpException('Unexpected', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async markLastClaimOnLands(lands: LandDto[]) {
        const date = new Date().getDate();
        await Promise.all(
            lands.map(async (land) => {
                const landDB = await this.landsRepository.findOne({
                    land_id: land.landId,
                    collection: land.collection,
                });

                if (landDB) {
                    landDB.lastClaim = date.toString();
                    await this.landsRepository.save(landDB);
                }
            }),
        );
    }

    async getStakeLandContract() {
        const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL[process.env.CHAIN]));
        const stakeLandsContract = new web3.eth.Contract(stakeLandAbi, STAKING_LAND[process.env.CHAIN || 43113]);
        return stakeLandsContract;
    }

    async getAvaxFeeFromGasUnits(gasUnits: number) {
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

    async getHeroLands({ owner, hero }: { owner: string; hero: number }): Promise<LandContract[]> {
        const stakeLandsContract = await this.getStakeLandContract();
        const lands = [];
        let index = 0;
        while (true) {
            try {
                const rawResponse: LandContract = await stakeLandsContract.methods.stakedLands(owner, index).call();
                if (+rawResponse.heroId == hero) {
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
        const stakeLandContract = await this.getStakeLandContract();
        const utils = Web3.utils;
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
}
