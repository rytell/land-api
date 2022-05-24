export interface Land {
    landId: number;
    collection: string;
}

export class ClaimLandDto {
    lands: Land[];
    heroNumber: number;
    owner: string;
    transactionHash?: string = '';
    v2: boolean; //TODO: Delete this property when the implementation of the versions is completed.
    version: string = "V3";
}
