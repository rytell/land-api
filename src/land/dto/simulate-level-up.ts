import { Land } from './claim-land';

export class SimulateLevelUpDto {
    lands: Land[];
    heroNumber: number;
    owner: string;
    v2: boolean;
}
