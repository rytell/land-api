interface Land {
    landId: number;
    collection: string;
}

export class SimulateClaimDto {
    lands: Land[];
    hero: number;
}
