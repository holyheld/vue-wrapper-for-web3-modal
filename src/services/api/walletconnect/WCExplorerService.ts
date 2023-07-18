import axios, { AxiosInstance } from 'axios';
import { chunkArray, getParamsSerializer } from '../../../helpers';
import { Listing, ListingParams, ListingResponse } from './types';

export class WCExplorerService {
  private readonly baseURL = 'https://explorer-api.walletconnect.com';

  protected readonly client: AxiosInstance;

  constructor(protected readonly projectId: string) {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Accept: 'application/json'
      },
      paramsSerializer: getParamsSerializer,
      validateStatus: (status) => status === 200
    });
  }

  private async fetchListings(endpoint: string, params: ListingParams): Promise<ListingResponse> {
    const url = new URL(endpoint, this.baseURL);

    url.searchParams.append('projectId', this.projectId);

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, String(value));
      }
    });
    return (await this.client.get<ListingResponse>(url.toString())).data;
  }

  public async getAllWallets(params: ListingParams) {
    return this.fetchListings('/v3/wallets', params);
  }

  public async getWalletsByIDs(ids: Array<string>): Promise<Array<Listing>> {
    const batches = chunkArray(ids, 29);
    const result: Array<Listing> = [];
    for (const batchIds of batches) {
      const params = {
        ids: batchIds.join(',')
      };
      const resp = (await this.getAllWallets(params)).listings;
      result.push(...Object.values(resp));
    }
    return result;
  }

  public getWalletImageUrl(imageId: string) {
    return `${this.baseURL}/v3/logo/md/${imageId}?projectId=${this.projectId}`;
  }
}
