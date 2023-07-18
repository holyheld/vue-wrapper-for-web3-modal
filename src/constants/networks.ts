
export enum Network {
  ethereum = "ethereum",
  polygon = "polygon",
  arbitrum = "arbitrum",
}

export type Token = {
  address: string;
  decimals: number;
  symbol: string;
  network: Network;
  name: string;
  iconURL: string;
};

export type APIKeys = {
  INFURA_PROJECT_ID: string;
};

export type NetworkInfo = {
  network: Network;
  name: string;
  chainId: number;
  explorer: string;
  explorerName: string;
  subsidizedUrl?: string;
  baseAsset: Token;
  rpcUrl: (apiKeys?: Partial<APIKeys>) => Array<string>;
  iconURL: string;
  displayedName: string;
};

export type NetworkInfoMap = Record<Network, NetworkInfo>;

export const AvailableNetworks: Array<Network> = [
  Network.ethereum,
  Network.polygon,
  Network.arbitrum,
];

export const networks: NetworkInfoMap = {
  [Network.ethereum]: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    network: Network.ethereum,
    explorer: 'https://etherscan.io',
    explorerName: 'Etherscan',
    subsidizedUrl: 'https://api.viamover.com/api/v1',
    iconURL:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAkFBMVEUAAABofuRogONnfuNwgN9of+Rof+Nof+RofuJ7juZofeRofuJogONpf+NpfuNofuNnf+JofuOGmelyiOZ2iuZof+NofuKClOf///////+GlulofuNofuP///97jufs7/tyhuX29/3Gz/Wrtu/Z3/i0vvGNnuq9x/Ogru2Onuqhru3j5/q0v/GXpuyElunQ1/eU/8pgAAAAHHRSTlMA3yDvEN+/n2CAcFBAz8+Qj4BQ36+voGAgEFB/2VY7bAAAAvxJREFUWMOdmOly6jAMRpXEZGcpS4FeZYGErZT2/d/upk56Pbcgyeb86HSZOWP5k2VTEFBZGoWehx3BJIySXMHzqPnMwzsWUbZ9SpcvAySoozfnxf0JkMWLN+46QZlY+9YeWuHFVjo/RGtWvuxLA3QgkBapZujIjC93gs5MfMZHp3E+0tn4T/jKqkXG6OzDfVE0nNHVVxZFsasdjVweVdFx4pK5H0Jcv5wLzdGle2JEJpFe2CJD+msDA+QSGWiQJvh/G1fIJaIRcsHQtmAcCpZywTUYPKRpjI/PxTNJJ0IihisyvMDAxpMTscpFWezgp3GZXKQlenIihj23RNC8yYnY5pJrYSQnYpvLEjq2NZvIPY0QSyYm4pDLnKiYSETOZdoJF0jxURAw9wuAohPZUcIKSRTkTCIkB6TI6HN8K2h2JT1nX+lEGL6QIIKQT8Q1lxAmfCKuuXgQUIkIHCghe3E+kQvIici5yMILZZGXCEQmreTbEyOCHNfvbNXthRpgpBDrA11tgxTjx41dnvVXondOutrzw5pD4ug115Kqu/3EjmP1Thy9FB/SFnutPPw6Mb2nbKlXSQIZefSqB3UfvuusP7o/1tS9p5gLtNKLvFX/qi11td8/l+SABY+Zr0PdjVZWl75absIuAGBKtU1vaYa6d0O1/Fs24h4OlyGGm1bqpZ53/a9K+gYAUAESnIqOvm7N8ec8viNBvYWOJVJci4EPRKxP8r0cwTe5xUVanRvzfc08HDSBw+NLdwzFCHpekOTL5U7GWOu4WLCuHF4Now3IS7yIc9qQwA9qhCj1jukYegcNaySpr+JLzuygIUSpd8wRIVgRHx7Z3rlIHx4NKdK0pmPEgg1TuegKaabwGzVmekfsmDHc40u90zAd4wNhZA7Mnvc5Gj+JjqF8srG5sT7SOEZnxoSP6B6RqQKe2O0fkimI+Cu0JvTBhniEVozWYEtioQxeFNiziUeyzpH5a03aljk8wzZ7XeAd3myu4HlUnkThONAmL4zSTJL9BaldKZtTB/9OAAAAAElFTkSuQmCC',
    baseAsset: {
      address: 'eth',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ether',
      iconURL:
        'https://github.com/trustwallet/assets/raw/master/blockchains/ethereum/info/logo.png',
      network: Network.ethereum
    },
    rpcUrl: (apiKeys) => {
      const urls = new Array<string>();

      if (apiKeys?.INFURA_PROJECT_ID !== undefined) {
        urls.push(`https://mainnet.infura.io/v3/${apiKeys.INFURA_PROJECT_ID}`);
      }

      return urls.concat('https://api.mycryptoapi.com/eth', 'https://cloudflare-eth.com');
    },
    displayedName: 'Ethereum'
  },
  [Network.polygon]: {
    chainId: 137,
    name: 'Polygon Mainnet',
    network: Network.polygon,
    explorer: 'https://polygonscan.com',
    explorerName: 'Polygonscan',
    subsidizedUrl: undefined,
    iconURL:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAflBMVEUAAACCR+aESOeATN+CR+WDR+WCSOSDR+SDR+WDR+aBR+WBSOWCR+aDR+aDSOOBSOODRueDSOeDR+WCR+X///+hdeuSXujBo/Lv6Pz39P3g0fmxjO+wjO+RXujQuvXv6PuJUuepgO2KUufIr/TJr/SaaerYxfe5l/Ho3frYxvfquEdmAAAAE3RSTlMA3yAQ759gUM+/kIBwr0CAf0CvNZTOAgAAAuFJREFUWMO9met2qjAQhRNIuCjay3AROGg91tq+/wueIy66iRGYwGq/n672kxnIThjFBH6Y6FhK+o+KYr1+8YU7kK0kWUgdzpO+bBQNoUPni3tWNIoMPHfdhPKZ7QsksZABS+fFxGbDqDtR5IAKprq3IkdW4+VG5EzkjfgkzUB6PN9yI3zuRoZvuTGiBUR2XvCfl6xKq2by6Qm4umafXtnfK5O7BjLXx1tRpjfKggyU2cYNz3fcpWBXU5/YoWA0z+TDqDsQQHKqfTdtVisl7vQzt3k2uwv+Zu3wSGe95pVFXjxspfLZHXzvV5kTUb5PQYFLZHbwjH+usu6zAz7Mu0sULeF0wd/V1gTqb2XWfbRthZorLIu/1Cc/3Qs3beoTV5jbvYAQtyVkC8kih/BGOFbxsWichavhe5xVWAh8oRxqYfOFTHERki9eJtbZLnMShmJNFrWxbAsnYSL0REg5CrWI7YRfIoxFNBhSh9MMoRTKSnjc33w/Q9gvNwWn27LND2PCt/dOCPrCP/2Q6qjrQeGlTHnCw3FwLe+PRojzhAgpW1h1q7GpeneP+kJ5L9wRsIXXL2zMHbA6E1AzhOnudGseQhxEInYVAoQ4iIVeIqysENcimS/8zMhiLUIn4fGAai/0gK3wnYTtasRSsvGFkA7CVvmB5llInIUZQuxeGQ2gsY1yhGNgG/WVKSwbe09gC9vz1yuEOJ/1eNunXKEWV7Z9IZR2iHMqblFds42jLkKKLZSiBTvpZwpOV+W5MnarcXBs91X/yIe6zZDKHN74sNnj9GxyqGmaJwwGsFqwtqyQmkI+fPFBAICvnDgEAiBm0Upe88Bm7OURdZec5uHlESBnkSloHr9ggNBB3QipGeMbf9mI4IeHGMvHLD87CFo+qvqFYRpwH/f5U/NSt4FkIibxXvm+2PvdoS54YijVky/4eIFk6viEeti22c78cUFL2yZX4aJfLLZrHUeqNclYJ5Oyf5jyfQ/DKHSOAAAAAElFTkSuQmCC',
    baseAsset: {
      address: 'matic',
      decimals: 18,
      symbol: 'MATIC',
      name: 'Matic',
      iconURL: 'https://github.com/trustwallet/assets/raw/master/blockchains/polygon/info/logo.png',
      network: Network.polygon
    },
    rpcUrl: () => [`https://polygon-rpc.com/`],
    displayedName: 'Polygon'
  },
  [Network.arbitrum]: {
    chainId: 42161,
    name: 'Arbitrum One',
    network: Network.arbitrum,
    explorer: 'https://arbiscan.io',
    explorerName: 'Arbiscan',
    subsidizedUrl: undefined,
    iconURL:
      'data:image/png;base64,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',
    baseAsset: {
      address: 'areth',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ether',
      iconURL:
        'https://github.com/trustwallet/assets/raw/master/blockchains/ethereum/info/logo.png',
      network: Network.arbitrum
    },
    rpcUrl: () => ['https://arb1.arbitrum.io/rpc'],
    displayedName: 'Arbitrum'
  }
};
