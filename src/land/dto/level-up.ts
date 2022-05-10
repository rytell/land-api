import { Land } from './claim-land';

export class LevelUpDto {
    lands: Land[];
    heroNumber: number;
    owner: string;
    transactionHash: string;
}
