import { SessionTypes } from '@walletconnect/types';
import { ConnectParams, NamespacesMap } from '@walletconnect/universal-provider';
import { deduplicate, filterDefined } from '../helpers/arrays';
import { getNetworkByChainId } from '../helpers/networks';
import { Network, AvailableNetworks, networks } from '../constants/networks';
import type { NetworkInfo } from '../constants';

export const getNetwork = (network: Network): NetworkInfo => {
  return networks[network];
};

export const buildCaipChain = (chainId: string | number): string => {
  if (typeof chainId === 'string') {
    return chainId.includes('eip155:') ? chainId : `eip155:${chainId}`;
  }

  return `eip155:${chainId}`;
};

const parseCAIPChain = (caipChain: string): number => {
  return Number.parseInt(caipChain.split(':')[1], 10);
};

export const parseNamespaceSupportedChains = (
  namespace: SessionTypes.Namespace
): Array<Network> => {
  const source = namespace.chains ?? namespace.accounts;

  const networkInfos = source.map(parseCAIPChain).map((chainId) => getNetworkByChainId(chainId));
  // if the wallet supports multiple accounts in the same network (e.g. Rainbow Wallet), there will de duplicates
  const duplicated = filterDefined(networkInfos).map((item) => item.network);
  // prevent unsupported (unavailable) networks from being used during the session
  return deduplicate(duplicated).filter((network) => AvailableNetworks.includes(network));
};

type Method =
  | 'eth_sendTransaction'
  | 'eth_signTypedData'
  | 'personal_sign'
  | 'eth_signTypedData_v4';

export const RequiredMethods: Array<Method> = ['eth_sendTransaction', 'personal_sign'];
export const OptionalMethods: Array<Method> = ['eth_signTypedData_v4'];

export const buildNamespace = (
  infos: Array<NetworkInfo>,
  methods: Array<Method> = []
): NamespacesMap => {
  return {
    eip155: {
      chains: deduplicate(infos.map(({ chainId }) => buildCaipChain(chainId))),
      events: ['chainChanged', 'accountsChanged'],
      methods: deduplicate(RequiredMethods.concat(methods)),
      rpcMap: infos.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.chainId]: curr.rpcUrl({
            INFURA_PROJECT_ID: import.meta.env.VITE_INFURA_PROJECT_ID
          })[0]
        };
      }, {} as Record<string, string>)
    }
  };
};

export const splitByPredicate = <T>(
  items: Array<T>,
  predicate: (item: T, idx: number, array: Array<T>) => boolean
): [Array<T>, Array<T>] => {
  const { found, others } = items.reduce(
    (acc, item, idx, array) => {
      if (predicate(item, idx, array)) {
        return {
          found: [...acc.found, item],
          others: acc.others
        };
      }

      return {
        found: acc.found,
        others: [...acc.others, item]
      };
    },
    {
      found: new Array<T>(),
      others: new Array<T>()
    }
  );

  return [found, others];
};

export const buildConnectParams = (
  supportedCAIPChains: Array<string> = ['eip155:1']
): ConnectParams => {
  const networkInfos = AvailableNetworks.map((network) => getNetwork(network));

  const supportedChainIds = supportedCAIPChains
    .map(parseCAIPChain)
    .filter((chainId) => networkInfos.some((info) => info.chainId === chainId));
  const supportedNetworks = filterDefined(supportedChainIds.map(getNetworkByChainId));
  const requiredNetworkInfos = deduplicate(supportedNetworks);

  const [requiredInfos, optionalInfos] = splitByPredicate(networkInfos, (info) =>
    requiredNetworkInfos.some((required) => info.network === required.network)
  );

  return {
    namespaces: buildNamespace(requiredInfos, RequiredMethods),
    optionalNamespaces: buildNamespace(
      requiredInfos.concat(optionalInfos),
      RequiredMethods.concat(OptionalMethods)
    )
  };
};
