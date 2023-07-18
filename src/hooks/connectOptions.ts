import { computed, readonly, ref } from 'vue';
import { CoreUtil } from '@walletconnect/modal-core';
import { filterDefined } from '../helpers';
import { desktopWalletsList, androidWalletsList, iosWalletsList } from '../constants';
import type { WalletDescription } from '../constants';
import { WCExplorerService } from '../services/api/walletconnect/WCExplorerService';
import type { Listing } from '../services/api/walletconnect/types';

export type WalletParameters = {
  id: string;
  name: string;
  image: string;
  features: {
    isDesktop: boolean;
    isWeb: boolean;
    isMobile: boolean;
  };
  links: {
    mobile: {
      native?: string;
      universal?: string;
    };
    desktop: {
      native?: string;
      universal?: string;
    };
    homepage?: string;
  };
  chains: Array<string>;
};

export type ConnectOption ={
  id: string;
  name: string;
  image: string;
  parameters: WalletParameters;
};

const isMobile = CoreUtil.isMobile();
const isAndroid = CoreUtil.isAndroid();

const wallets = ref<Array<WalletParameters>>([]);
const loading = ref(false);
const walletConnectLink = ref<string>();
const service = new WCExplorerService(import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID);
const connectingTo = ref<WalletParameters>();

const isNullish = (value: string | undefined | null): value is undefined | null => {
  return value === undefined || value === null || value == '';
};

export const mapListing = (item: Listing, service: WCExplorerService): WalletParameters | undefined => ({
  id: item.id,
  name: item.name,
  image: service.getWalletImageUrl(item.image_id),
  features: {
    isDesktop: !isNullish(item.desktop?.native),
    isWeb: !isNullish(item.desktop?.universal),
    isMobile: !isNullish(item.mobile.native) || !isNullish(item.mobile.universal),
  },
  links: {
    mobile: {
      native: isNullish(item.mobile.native) ? undefined : item.mobile.native,
      universal: isNullish(item.mobile.universal) ? undefined : item.mobile.universal
    },
    desktop: {
      native: isNullish(item.desktop.native) ? undefined : item.desktop.native,
      universal: isNullish(item.desktop.universal) ? undefined : item.desktop.universal
    },
    homepage: isNullish(item.homepage) ? undefined : item.homepage
  },
  chains: item.chains ?? []
});

export const handleMobileLinking = (item: WalletParameters, uri: string) => {
  const { native, universal } = item.links.mobile;

  let href = '';
  if (native !== undefined) {
    href = CoreUtil.formatNativeUrl(native, uri, item.name);
  } else if (universal !== undefined) {
    href = CoreUtil.formatUniversalUrl(universal, uri, item.name);
  }
  CoreUtil.openHref(href, '_self');
};

const openDesktopApp = (item: WalletParameters, uri: string) => {
  const nativeUrl = item.links.desktop.native;

  if (nativeUrl !== undefined) {
    const href = CoreUtil.formatNativeUrl(nativeUrl, uri, item.name);
    CoreUtil.openHref(href, '_self');
  }
};

const openWebWallet = (item: WalletParameters, uri: string) => {
  const universalUrl = item.links.desktop.universal;

  if (universalUrl !== undefined) {
    const href = CoreUtil.formatUniversalUrl(universalUrl, uri, item.name);
    CoreUtil.openHref(href, '_blank');
  }
};

const openMobileApp = (item: WalletParameters, uri: string, forceUniversalUrl: boolean) => {
  const nativeUrl = item.links.mobile.native;
  const universalUrl = item.links.mobile.universal;

  if (!forceUniversalUrl && nativeUrl !== undefined) {
    const href = CoreUtil.formatNativeUrl(nativeUrl, uri, item.name);
    CoreUtil.openHref(href, '_self');
  } else if (universalUrl !== undefined) {
    const href = CoreUtil.formatUniversalUrl(universalUrl, uri, item.name);
    CoreUtil.openHref(href, '_self');
  }
};

const installWallet = (item: WalletParameters) => {
  const uri = item.links.homepage;

  if (uri) {
    CoreUtil.openHref(uri, '_blank');
  }
};

export const handleLinking = (
  item: WalletParameters,
  uri: string,
  forceUniversalUrl = false
): string | undefined => {
  const isMobileDevice = CoreUtil.isMobile();
  const { isDesktop, isWeb, isMobile } = item.features;

  if (isMobileDevice) {
    if (isMobile) {
      openMobileApp(item, uri, forceUniversalUrl);
    } else if (isWeb) {
      openWebWallet(item, uri);
    } else {
      installWallet(item);
    }
  } else if (isDesktop) {
    openDesktopApp(item, uri);
  } else if (isWeb) {
    openWebWallet(item, uri);
  } else if (isMobile) {
    return uri;
  } else {
    installWallet(item);
  }
};


const onWalletConnectDisplayURI = (walletParameters: WalletParameters, uri: string) => {
  walletConnectLink.value = uri;
  if (CoreUtil.isAndroid()) {
    handleMobileLinking(walletParameters, uri);
  } else {
    handleLinking(walletParameters, uri);
  }
};

const load = async (): Promise<void> => {
  if (wallets.value.length > 0) {
    return;
  }

  loading.value = true;

  try {
    const listings = await service.getWalletsByIDs(availableWCWalletIds.value);
    wallets.value = filterDefined(listings.map((listing) => mapListing(listing, service)));
  } finally {
    loading.value = false;
  }
};

export const supportedWallets = computed<Array<WalletDescription>>(() => {
  if (!isMobile && !isAndroid) {
    return desktopWalletsList;
  }

  if (isAndroid) {
    return androidWalletsList;
  }

  return iosWalletsList;
});

export const availableWCWalletIds = computed(() => supportedWallets.value.map((wallet) => wallet.id));

export const connectionOptions = computed<Array<ConnectOption>>(() => {
  const options = supportedWallets.value.map((option): ConnectOption | undefined => {
    const walletItem = wallets.value.find((wallet) => wallet.id === option.id);

    if (walletItem === undefined) {
      return undefined;
    }

    return {
      id: walletItem.id,
      image: walletItem.image,
      name: walletItem.name,
      parameters: walletItem,
    };
  });

  return filterDefined(options);
});

export const useConnectOptions = () => {
  return {
    connectionOptions: connectionOptions,
    loading: readonly(loading),
    load,
    walletConnectLink: readonly(walletConnectLink),
    connectingTo: readonly(connectingTo),
    onWalletConnectDisplayURI
  };
};
