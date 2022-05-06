export interface Land {
    landId: number;
    collection: string;
}

export class ClaimLandDto {
    lands: Land[];
    heroNumber: number;
    owner: string;
    transactionHash?: string = '';
}