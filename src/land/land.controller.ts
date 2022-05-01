import {
    Body,
    Controller,
    Get,
    HttpException,
    Post,
    Query,
} from '@nestjs/common';
import { LandService } from './land.service';
import { Land } from './land.entity';
import { CreateLandDto } from './dto/create-land';
import { SimulateClaimDto } from './dto/simulate-claim';

@Controller('land')
export class LandController {
    constructor(private readonly landService: LandService) {}

    @Post()
    create(@Body() body): Promise<Land> {
        const createLandDto: CreateLandDto = body.createLandDto;
        return this.landService.create(createLandDto);
    }

    @Post('simulate-claim')
    simulateClaim(@Body() body): Promise<any> {
        const simulateClaimDto: SimulateClaimDto = body.simulateClaimDto;
        return this.landService.simulateClaim(simulateClaimDto);
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

    @Post('mint-estimation')
    getMintEstimation(@Body() body): any {
        // const mintEstimationDto: any = body.mintEstimationDto;

        return 'hello world';
    }

    @Get()
    test(): string {
        return this.landService.test();
    }
}
