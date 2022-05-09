import { Body, Controller, Get, HttpException, Post, Query } from '@nestjs/common';
import { LandService } from './land.service';
import { Land } from './land.entity';
import { CreateLandDto } from './dto/create-land';
import { ClaimLandDto } from './dto/claim-land';
import { SimulateLevelUpDto } from './dto/simulate-level-up';
import { LevelUpDto } from './dto/level-up';

@Controller('land')
export class LandController {
    constructor(private readonly landService: LandService) {}

    @Post()
    create(@Body() body): Promise<Land> {
        const createLandDto: CreateLandDto = body.createLandDto;
        return this.landService.create(createLandDto);
    }

    @Post('simulate-claim')
    async simulateClaim(@Body() body): Promise<any> {
        const simulateClaimDto: ClaimLandDto = body.simulateClaimDto;
        return await this.landService.simulateClaim(simulateClaimDto);
    }

    @Post('claim')
    async claim(@Body() body): Promise<any> {
        const claimLandDto: ClaimLandDto = body.claimLandDto;
        return await this.landService.claim(claimLandDto);
    }

    @Get('per-hero')
    getHeroLands(@Query() query): any {
        if (!query.hero || !query.owner) {
            throw new HttpException('Hero or owner not defined', 400);
        }
        return this.landService.getHeroLands({
            hero: query.hero,
            owner: query.owner,
        });
    }

    @Get('heros')
    getStakedHeros(@Query() query): any {
        if (!query.owner) {
            throw new HttpException('Owner not defined', 400);
        }
        return this.landService.getStakedHeros({
            owner: query.owner,
        });
    }

    @Get('staked')
    getStakedLands(@Query() query): any {
        if (!query.owner) {
            throw new HttpException('Owner not defined', 400);
        }
        return this.landService.getStakedLands({
            owner: query.owner,
        });
    }

    @Post('level-up-estimation')
    async getLevelUpEstimation(@Body() body): Promise<any> {
        const simulateLevelUpDto: SimulateLevelUpDto = body.simulateLevelUpDto;
        return await this.landService.simulateLevelUp(simulateLevelUpDto);
    }

    @Post('level-up')
    async levelUp(@Body() body): Promise<any> {
        const levelUpDto: LevelUpDto = body.levelUpDto;
        return await this.landService.levelUp(levelUpDto);
    }

}
