import { ChainId, Token } from '@rytell/sdk';

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  size: number;
  extraData: string;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  transactions: string[];
  uncles: [];
}

export interface HeroContract {
  staked: boolean;
  lastStaked: string;
  lastUnstaked: string;
  heroId: string;
  owner: string;
}

export interface HeroStakingEvent {
  address: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
  id: string;
  returnValues: {
    '0': string;
    '1': string;
    '2': string;
    who: string;
    heroNumber: string;
    when: string;
  };
  event: string;
  signature: string;
  raw: {
    data: string;
    topics: string[];
  };
}

export const RPC_URL = {
  [ChainId.FUJI]:
    'https://speedy-nodes-nyc.moralis.io/47081753cf11c09387130dee/avalanche/testnet',
  [ChainId.AVALANCHE]:
    'https://speedy-nodes-nyc.moralis.io/47081753cf11c09387130dee/avalanche/mainnet',
};

export const WSS_URL = {
  [ChainId.FUJI]:
    'wss://speedy-nodes-nyc.moralis.io/47081753cf11c09387130dee/avalanche/testnet/ws',
  [ChainId.AVALANCHE]:
    'wss://speedy-nodes-nyc.moralis.io/47081753cf11c09387130dee/avalanche/mainnet/ws',
};

export const STAKING_LAND = {
  [ChainId.FUJI]: '0x1C318d19A098202858B44B200c63033d47B92206',
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
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    '0x9c5bBb5169B66773167d86818b3e149A4c7e1d1A',
    18,
    'RADI',
    'RADI',
  ),
};

export const WOOD = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    '0xd1d80Ddcc05043EDE8eC1585C1cA3d7EBc61Ae5E',
    18,
    'RWPLK',
    'Rytell Wooden Plank',
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    '0x0000000000000000000000000000000000000000',
    18,
    'RWPLK',
    'Rytell Wooden Plank',
  ),
};
export const WHEAT = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    '0xFb0c48CfB87939afD8642E615B4e5acaeADe9AE8',
    18,
    'RWHT',
    'Rytell Wheat',
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    '0x0000000000000000000000000000000000000000',
    18,
    'RWHT',
    'Rytell Wheat',
  ),
};
export const STONE = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    '0xe3228aD79B201c1e32318ed9dE51b53cDB055237',
    18,
    'RSBLK',
    'Rytell Stone Block',
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    '0x0000000000000000000000000000000000000000',
    18,
    'RSBLK',
    'Rytell Stone Block',
  ),
};
export const IRON = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    '0xbF23C85C5890892e3c9D94aC61fD4c1573CbeD57',
    18,
    'RIORE',
    'Rytell Iron Ore',
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    '0x0000000000000000000000000000000000000000',
    18,
    'RIORE',
    'Rytell Iron Ore',
  ),
};
