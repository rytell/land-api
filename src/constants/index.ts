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
    [ChainId.FUJI]:
        'https://api.avax-test.network/ext/bc/C/rpc',
    [ChainId.AVALANCHE]:
        'https://api.avax.network/ext/bc/C/rpc',
};

export const WSS_URL = {
    [ChainId.FUJI]:
        'wss://api.avax-test.network/ext/bc/C/ws',
    [ChainId.AVALANCHE]:
        'wss://api.avax.network/ext/bc/C/ws',
};

export const STAKING_LAND = {
    [ChainId.FUJI]: '0xC9f30592480b3FB2B7aeAa02bb99bA09E2865107',
    [ChainId.AVALANCHE]: '0xAE0409727A3A8D2FCA564E183FDeD971288b3125',
};

// solves a critical bug from v1
export const STAKING_LAND_V2 = {
    [ChainId.FUJI]: '0xCEc841fA9c9BeFD5A861571EE5E55168672EDf24',
    [ChainId.AVALANCHE]: '0xd19f43e483A67D70888DA1547c2375732b4B5879',
};

// let users migrate from v1 and v2
export const STAKING_LAND_V3 = {
    [ChainId.FUJI]: '0x19aE2a813Bc10147a3700101359AdD1579aa9274',
    [ChainId.AVALANCHE]: '0x25600Cc62b221e05AEfAF8060C3CFd855911cEB6',
};

export const STAKING_LAND_HASH = {
    V1: {
        [ChainId.FUJI]: '0xC9f30592480b3FB2B7aeAa02bb99bA09E2865107',
        [ChainId.AVALANCHE]: '0xAE0409727A3A8D2FCA564E183FDeD971288b3125',
    },
    V2: {
        [ChainId.FUJI]: '0xCEc841fA9c9BeFD5A861571EE5E55168672EDf24',
        [ChainId.AVALANCHE]: '0xd19f43e483A67D70888DA1547c2375732b4B5879',
    },
    V3: {
        [ChainId.FUJI]: '0x19aE2a813Bc10147a3700101359AdD1579aa9274',
        [ChainId.AVALANCHE]: '0x25600Cc62b221e05AEfAF8060C3CFd855911cEB6',
    },
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
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0x4c0E28fFedBFc761a7be92596ff8c7940188b684', 18, 'RWPLK', 'Rytell Wooden Plank'),
};
export const WHEAT = {
    [ChainId.FUJI]: new Token(ChainId.FUJI, '0xFb0c48CfB87939afD8642E615B4e5acaeADe9AE8', 18, 'RWHT', 'Rytell Wheat'),
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0xD73d3E047266EaB2309F9929AafE8Fc3e7cEC072', 18, 'RWHT', 'Rytell Wheat'),
};
export const STONE = {
    [ChainId.FUJI]: new Token(ChainId.FUJI, '0xe3228aD79B201c1e32318ed9dE51b53cDB055237', 18, 'RSBLK', 'Rytell Stone Block'),
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0xdcA5a32D4528378e5B9a553a2A0bcFc14B9c2D1e', 18, 'RSBLK', 'Rytell Stone Block'),
};
export const IRON = {
    [ChainId.FUJI]: new Token(ChainId.FUJI, '0xbF23C85C5890892e3c9D94aC61fD4c1573CbeD57', 18, 'RIORE', 'Rytell Iron Ore'),
    [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, '0x3D05755C9Abad73951594D37891982b9c917BDAF', 18, 'RIORE', 'Rytell Iron Ore'),
};

export const SNOWTRACE = {
    [ChainId.FUJI]: 'https://api-testnet.snowtrace.io',
    [ChainId.AVALANCHE]: 'https://api.snowtrace.io',
};

export const blackListLands = [
    {
        id: 1069,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 2912,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 5644,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 4097,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 5968,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 5702,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 5731,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 9186,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 6474,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 1850,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 2424,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 1077,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 2079,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 2117,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 7512,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 7594,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 7970,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 8167,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 9070,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 1403,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
    {
        id: 2078,
        collection: '0xce0918fFaac97e468af737B64cAD444B6caA024b'
    },
]