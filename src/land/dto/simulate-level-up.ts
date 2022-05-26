import { Land } from './claim-land';

export class SimulateLevelUpDto {
    lands: Land[];
    heroNumber: number;
    owner: string;
    v2: boolean; //TODO: Delete this property when the implementation of the versions is completed.
    version: string = "V3";
}
