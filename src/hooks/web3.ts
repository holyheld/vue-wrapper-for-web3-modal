import { computed, reactive, shallowRef, toRefs } from 'vue';
import { CustomError } from 'ts-custom-error';
import { CoreUtil } from '@walletconnect/modal-core';
import { SessionTypes } from '@walletconnect/types';
import { SignClientTypes } from '@walletconnect/types/dist/types/sign-client/client';
import WalletConnectProvider from '@walletconnect/universal-provider';
import Web3 from 'web3';
import type { AbstractProvider } from 'web3-core';
import { useLocalStorage } from '@vueuse/core';
import { sameAddress, isRecord, isString, getNetworkByChainId, buildCaipChain, buildConnectParams, parseNamespaceSupportedChains } from '../helpers';
import { AvailableNetworks, networks, Network, ProviderRpcErrorCode, WalletConnectErrorSignature } from '../constants';
import { useConnectOptions } from './connectOptions';
import type { WalletParameters } from './connectOptions';

export interface ProviderRpcError extends CustomError {
  code: number;
  data?: unknown;
}

type Provider = WalletConnectProvider;


const state = reactive<{
  connectedProvider: Provider | undefined;
  connectedProviderInfo: WalletParameters | undefined;
  connectingProviderInfo: WalletParameters | undefined;
  address: string | undefined;
  isConnected: boolean;
  chainId: number;
  walletConnectSession?: SessionTypes.Struct;
  supportedNetworks: Array<Network>;
}>({
  connectedProvider: undefined,
  connectedProviderInfo: undefined,
  connectingProviderInfo: undefined,
  address: undefined,
  isConnected: false,
  chainId: -1,
  walletConnectSession: undefined,
  supportedNetworks: []
});

const web3 = shallowRef<Web3>();

const CACHED_PROVIDER_KEY = 'WEB3_CONNECT_CACHED_PROVIDER';

const cachedProvider = useLocalStorage<string | undefined>(CACHED_PROVIDER_KEY, undefined);

export type isChainNotValidExpectedResponse =
  | {
      isExpectedError: true;
      chainId: number;
    }
  | {
      isExpectedError: false;
    };

const invalidChainidRegExp = /Given value "(\d+)" is not a valid hex string./;

export const isChainNotValidExpected = (error: Error): isChainNotValidExpectedResponse => {
  const match = error.message.match(invalidChainidRegExp);
  if (match === undefined || match === null || match.length !== 2) {
    return {
      isExpectedError: false
    };
  }

  const newChainId = parseInt(match[1], 10);

  if (isNaN(newChainId)) {
    return {
      isExpectedError: false
    };
  }

  return {
    isExpectedError: true,
    chainId: newChainId
  };
};

export const getChainIdWithFallback = async (web3: Web3): Promise<number> => {
  try {
    return await web3.eth.getChainId();
  } catch (error) {
    if (error instanceof Error) {
      // Some WC wallets like rainbow send chainId as decimal string not a number
      // WC updates it in web3 provider and that makes exceptions during getChainId call
      // we can handle this error and extract the chainId from string
      // TODO: probably this error can bring some more errors into our flow needs check
      const expectedErrorResult = isChainNotValidExpected(error);
      if (expectedErrorResult.isExpectedError) {
        return expectedErrorResult.chainId;
      } else {
        throw error;
      }
    }
    throw error;
  }
};

const disconnect = async () => {
  if (state.connectedProvider !== undefined) {
    state.connectedProvider.removeListener?.('disconnect', fullDisconnect);
    state.connectedProvider.removeListener?.('chainChanged', handleChainChanged);
    state.connectedProvider.removeListener?.('accountsChanged', handleAccountsChanged);

    const wc = state.connectedProvider as WalletConnectProvider;
    wc.removeListener('session_delete', fullDisconnect);
    wc.removeListener('session_update', handleSessionUpdated);
    wc.removeListener('session_expire', handleSessionUpdated);
    CoreUtil.removeWalletConnectDeepLink();

    if ('disconnect' in state.connectedProvider) {
      try {
        await state.connectedProvider.disconnect();
      } catch (error) {
        // silent this error
      }
    }
  }

  state.walletConnectSession = undefined;
  state.address = undefined;
  state.connectedProvider = undefined;
  state.connectedProviderInfo = undefined;
  web3.value = undefined;
  state.chainId = -1;
  cachedProvider.value = undefined;
  state.isConnected = false;
};

const fullDisconnect = async () => {
  await disconnect()
  window.location.reload();
};

const handleAccountsChanged = async (accounts: Array<string>) => {
  if (accounts.length === 1 && sameAddress(state.address, accounts[0])) {
    return;
  }

  window.location.reload();
};

const handleChainChanged = async (chainId: string | number) => {
  if (
    state.chainId === chainId ||
    (typeof chainId === 'string' && state.chainId === parseInt(chainId, 16)) ||
    String(state.chainId) === chainId
  ) {
    return;
  }

  if (web3.value) {
    state.chainId = await getChainIdWithFallback(web3.value);
  }
};

const handleSessionUpdated = (args: SignClientTypes.EventArguments['session_update']) => {
  if (state.walletConnectSession !== undefined) {
    state.walletConnectSession = {
      ...state.walletConnectSession,
      namespaces: args.params.namespaces
    };
  }
};

export const isProviderRpcError = (error: unknown): error is ProviderRpcError => {
  if (!(error instanceof Object)) {
    return false;
  }

  const candidate = error as Partial<ProviderRpcError>;
  return !(candidate.message === undefined || candidate.code === undefined);
};

const isRejectedRequestError = (error: unknown): boolean => {
  if (isProviderRpcError(error) && error.code === ProviderRpcErrorCode.UserRejectedRequest) {
    return true;
  }

  if (error instanceof Error) {
    switch (error.message) {
      case WalletConnectErrorSignature.FailedOrRejectedRequest:
      case WalletConnectErrorSignature.RejectedByTheUser:
      case WalletConnectErrorSignature.RejectedByUser:
      case WalletConnectErrorSignature.SignatureDenied:
      case WalletConnectErrorSignature.RejectedByUser2:
      case WalletConnectErrorSignature.AmbireUserRejectedRequest:
      case WalletConnectErrorSignature.RequestRejected:
        return true;
    }
  }

  return false;
};

const pureConnect = async (parameters: WalletParameters): Promise<void> => {
  let provider: Provider | undefined;

  if (parameters === undefined) {
    throw new Error('empty provider parameters');
  }

  provider = await connectWalletConnect(parameters);

  const web3Provider = new Web3(provider as AbstractProvider);

  let accounts: Array<string> = [];
  try {
    // Ethereum-enabled DOM environments use requestAccounts per EIP-1102 (eth_requestAccounts)
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1102.md
    // https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#requestaccounts
    accounts = await web3Provider.eth.requestAccounts();
  } catch (error) {
    const rejectedRequestMessages = [
      'user rejected the request.',
      'user closed modal',
      'user denied account authorization'
    ];

    if (
      isRejectedRequestError(error) ||
      ((error instanceof Error ||
        (isRecord(error) && 'message' in error && isString(error.message))) &&
        rejectedRequestMessages.includes(error.message.toLowerCase()))
    ) {
      throw error;
    }

    accounts = await web3Provider.eth.getAccounts();
  }

  if (accounts.length < 1) {
    throw new Error('empty account');
  }

  state.address = accounts[0];
  state.connectedProvider = provider;
  state.connectedProviderInfo = parameters;
  web3.value = web3Provider;

  state.chainId = await getChainIdWithFallback(web3.value);
  state.isConnected = true;

  state.connectedProvider.on?.('chainChanged', handleChainChanged);
  state.connectedProvider.on?.('disconnect', () => fullDisconnect);
  state.connectedProvider.on?.('accountsChanged', handleAccountsChanged);

  cachedProvider.value = JSON.stringify(parameters);
};

const connectWalletConnect = async (parameters: WalletParameters): Promise<Provider> => {
  const params = buildConnectParams(parameters.chains);

  const provider = await WalletConnectProvider.init({
    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID
  });

  state.connectedProvider = provider;
  state.connectedProviderInfo = parameters;

  provider.on('session_delete', fullDisconnect);
  provider.on('session_update', handleSessionUpdated);
  provider.on('session_expire', fullDisconnect);

  if (provider.session !== undefined) {
    state.walletConnectSession = provider.session;
    return provider;
  }

  provider.on('display_uri', (uri: string) => {
    const { onWalletConnectDisplayURI } = useConnectOptions();
    onWalletConnectDisplayURI(parameters, uri);
  });

  state.walletConnectSession = await provider.connect(params);

  return provider;
};

const supportedNetworks = computed(() => {
  if (state.walletConnectSession === undefined) {
    return AvailableNetworks.slice();
  }

  return parseNamespaceSupportedChains(state.walletConnectSession.namespaces.eip155).sort(
    (a, b) => AvailableNetworks.indexOf(a) - AvailableNetworks.indexOf(b)
  );
});

const supportsSignTypedDataV4 = computed(() => {
  if (state.walletConnectSession === undefined) {
    return false;
  }

  return state.walletConnectSession.namespaces.eip155.methods.includes('eth_signTypedData_v4');
});

const connect = async (parameters: WalletParameters): Promise<void> => {
  try {
    state.connectingProviderInfo = parameters;
    await pureConnect(parameters);
  } catch (error) {
    await disconnect();
  } finally {
    state.connectingProviderInfo = undefined;
  }
};


const tryConnectCachedProvider = async (): Promise<void> => {
  if (cachedProvider.value === undefined) {
    return;
  }

  let parsedCachedProvider: WalletParameters;
  try {
    parsedCachedProvider = JSON.parse(cachedProvider.value);
  } catch {
    cachedProvider.value = undefined;
    return;
  }

  try {
    await connect(parsedCachedProvider);
  } catch (error) {
    cachedProvider.value = undefined;
    throw error;
  }
};

const changeNetwork = async (network: Network): Promise<void> => {
  if (!AvailableNetworks.includes(network)) {
    throw new Error('unsupported network');
  }

  if (!state.isConnected || web3.value === undefined) {
    throw new Error('not connected');
  }

  const networkInfo = networks[network];

  const wc = state.connectedProvider as WalletConnectProvider | undefined;
  if (wc === undefined) {
    throw new Error('not connected');
  }

  if (state.walletConnectSession === undefined && wc.session !== undefined) {
    state.walletConnectSession = wc.session;
  }

  if (state.walletConnectSession === undefined) {
    throw new Error('not connected');
  }

  if (state.address === undefined) {
    throw new Error('empty account');
  }

  if (!supportedNetworks.value.includes(networkInfo.network)) {
    throw new Error('unsupported network');
  }

  wc.setDefaultChain(buildCaipChain(networkInfo.chainId));
};

const signMessage = (messageOrData: string | Record<string, unknown>): Promise<string> => {
  const pureMessage =
    typeof messageOrData === 'string' ? messageOrData : JSON.stringify(messageOrData);

  if (state.address === undefined) {
    throw new Error('address is undefined in web3 hook -> `signPersonalMessage`');
  }

  if (state.connectedProvider === undefined) {
    throw new Error('empty provider');
  }

  return (state.connectedProvider).request({
    method: 'personal_sign',
    params: [
      Web3.utils.isHexStrict(pureMessage) ? pureMessage : Web3.utils.utf8ToHex(pureMessage),
      state.address
    ]
  });
};

const network = computed(() => getNetworkByChainId(state.chainId)?.network ?? Network.ethereum);

export const useWeb3 = () => {
  return {
    ...toRefs(state),
    web3: web3,
    connect,
    tryConnectCachedProvider,
    disconnect,
    changeNetwork,
    network,
    signMessage,
    supportedNetworks,
    supportsSignTypedDataV4
  };
};
