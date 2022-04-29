import { Body, Controller, Post } from '@nestjs/common';
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

    @Post()
    simulateClaim(@Body() body): Promise<any> {
        const simulateClaimDto: SimulateClaimDto = body.simulateClaimDto;
        return this.landService.simulateClaim(simulateClaimDto);
    }


}
