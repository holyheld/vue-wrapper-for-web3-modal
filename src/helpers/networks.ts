import { networks } from '../constants';
import type { NetworkInfo } from '../constants';

export const getNetworkByChainId = (chainId: number): NetworkInfo | undefined => {
  return (Object.values(networks) as Array<NetworkInfo>).find((n) => n.chainId === chainId);
};
