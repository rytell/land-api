import { ChainId, Token } from '@rytell/sdk';

export interface HeroContract {
    staked: boolean;
    lastStaked: string;
    lastUnstaked: string;
    heroId: string;
    owner: string;
}

export interface LandContract {
    landId: string;
    collection: string;
    staked: boolean;
    level: string;
    heroId: string;
    lastStaked: number;
    lastUnstaked: number;
    lastLeveledUp: number;
    owner: string;
}

export const RPC_URL = {
    [ChainId.FUJI]: 'https://speedy-nodes-nyc.moralis.io/47081753cf11c09387130dee/avalanche/testnet',
    [ChainId.AVALANCHE]: 'https://speedy-nodes-nyc.moralis.io/47081753cf11c09387130dee/avalanche/mainnet',
};

export const WSS_URL = {
    [ChainId.FUJI]: 'wss://speedy-nodes-nyc.moralis.io/47081753cf11c09387130dee/avalanche/testnet/ws',
    [ChainId.AVALANCHE]: 'wss://speedy-nodes-nyc.moralis.io/47081753cf11c09387130dee/avalanche/mainnet/ws',
};

export const STAKING_LAND = {
    // [ChainId.FUJI]: '0x1C318d19A098202858B44B200c63033d47B92206',
    // [ChainId.FUJI]: '0x733ecAa6611513BfaDf03E1E156Cf7D991c281F0', // new version
    [ChainId.FUJI]: '0xC9f30592480b3FB2B7aeAa02bb99bA09E2865107', // with lastLeveledUp
    [ChainId.AVALANCHE]: '0x0000000000000000000000000000000000000000',
};

export const LAND_COLLECTIONS = [
    {
        // CLAIMABLE
        [ChainId.FUJI]: '0x083f5D926c3D1fbC61406A5795542E79Fbce04c0',
        [ChainId.AVALANCHE]: '0xce0918fFaac97e468af737B64cAD444B6caA024b',
    },
];

export const RADI: { [chainId in ChainId]: Token } = {
    [ChainId.FUJI]: new Token(
        ChainId.FUJI,
        // '0x600615234c0a427834A4344D10fEaCA374B2dfCB',
        '0xCcA36c23E977d6c2382dF43e930BC8dE9daC897E',
        18,
        'RADI',
        'RADI',
    ),
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0x9c5bBb5169B66773167d86818b3e149A4c7e1d1A', 18, 'RADI', 'RADI'),
};

export const WOOD = {
    [ChainId.FUJI]: new Token(ChainId.FUJI, '0xd1d80Ddcc05043EDE8eC1585C1cA3d7EBc61Ae5E', 18, 'RWPLK', 'Rytell Wooden Plank'),
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0x0000000000000000000000000000000000000000', 18, 'RWPLK', 'Rytell Wooden Plank'),
};
export const WHEAT = {
    [ChainId.FUJI]: new Token(ChainId.FUJI, '0xFb0c48CfB87939afD8642E615B4e5acaeADe9AE8', 18, 'RWHT', 'Rytell Wheat'),
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0x0000000000000000000000000000000000000000', 18, 'RWHT', 'Rytell Wheat'),
};
export const STONE = {
    [ChainId.FUJI]: new Token(ChainId.FUJI, '0xe3228aD79B201c1e32318ed9dE51b53cDB055237', 18, 'RSBLK', 'Rytell Stone Block'),
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0x0000000000000000000000000000000000000000', 18, 'RSBLK', 'Rytell Stone Block'),
};
export const IRON = {
    [ChainId.FUJI]: new Token(ChainId.FUJI, '0xbF23C85C5890892e3c9D94aC61fD4c1573CbeD57', 18, 'RIORE', 'Rytell Iron Ore'),
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0x0000000000000000000000000000000000000000', 18, 'RIORE', 'Rytell Iron Ore'),
};

export const SNOWTRACE = {
    [ChainId.FUJI]: 'https://api-testnet.snowtrace.io',
    [ChainId.AVALANCHE]: 'https://api.snowtrace.io',
};