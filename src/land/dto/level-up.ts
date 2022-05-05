import { Land } from './simulate-claim';

export class LevelUpDto {
    lands: Land[];
    heroNumber: number;
    owner: string;
    transactionHash: string;
}
