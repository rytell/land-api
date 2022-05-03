interface Land {
    landId: number;
    collection: string;
}

export class SimulateClaimDto {
    lands: Land[];
    heroNumber: number;
    owner: string;
}
