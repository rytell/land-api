import { Body, Controller, Post } from '@nestjs/common';
import { LandService } from './land.service';
import { Land } from './land.entity';
import { CreateLandDto } from './dto/create-land';

@Controller('land')
export class LandController {
    constructor(private readonly landService: LandService) {}

    @Post()
    create(@Body() body): Promise<Land> {
        const createLandDto: CreateLandDto = body.createLandDto;
        return this.landService.create(createLandDto);
    }
}
