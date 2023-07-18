export interface Listing {
  id: string;
  name: string;
  homepage: string;
  image_id: string;
  slug: string;
  chains: Array<string> | null;
  app: {
    browser: string | null;
    ios: string | null;
    android: string | null;
    mac: string | null;
    windows: string | null;
    linux: string | null;
    chrome: string | null;
    firefox: string | null;
    safari: string | null;
    edge: string | null;
    opera: string | null;
  };
  injected:
    | Array<{
        injected_id: string | null;
        namespace: string | null;
      }>
    | null;
  mobile: {
    native: string | null;
    universal: string | null;
  };
  desktop: {
    native: string | null;
    universal: string | null;
  };
  metadata: {
    shortName: string;
    colors: { primary: string | null; secondary: string | null };
  };
  versions: Array<string> | null;
  updatedAt: string;
}

export interface ListingResponse {
  listings: Array<Listing>;
  total: number;
}

export interface ListingParams {
  page?: number;
  search?: string;
  entries?: number;
  version?: number;
  chains?: string;
  ids?: string;
  recommendedIds?: string;
  excludedIds?: string;
  sdks?: string;
}
