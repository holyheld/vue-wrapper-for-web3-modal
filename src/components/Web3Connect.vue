<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CoreUtil } from '@walletconnect/modal-core';
import { generateQrCode } from '../helpers/qr';
import { useConnectOptions } from '../hooks/connectOptions';
import type { WalletParameters } from '../hooks/connectOptions';
import { useWeb3 } from '../hooks/web3';
import Web3ConnectButton from './Web3ConnectButton.vue';

const QR_CODE_SIZE = 200;
const QR_CODE_IMAGE_SIZE = 32;

const { tryConnectCachedProvider, connect, connectedProviderInfo, connectingProviderInfo, disconnect, signMessage } = useWeb3();

const { load, connectionOptions, walletConnectLink } = useConnectOptions();

const qrCodeDataURL = ref<string>();
const signature = ref<string>();

watch(
  walletConnectLink,
  async () => {
    if (walletConnectLink.value === undefined) {
      qrCodeDataURL.value = undefined;
      return;
    }

    try {
      qrCodeDataURL.value = `data:image/svg+xml;base64,${window.btoa(
        generateQrCode(walletConnectLink.value, QR_CODE_SIZE, QR_CODE_IMAGE_SIZE)
      )}`;
    } catch {
      throw new Error('failed to create QR')
    }
  },
  { immediate: true }
);

const items = computed((): WalletParameters[] => connectionOptions.value .map((item) => ({ ...item.parameters })));

const currentProvider = computed((): WalletParameters | null => {
  return (
    items.value.find(
      (item) =>
        item.id &&
        [connectedProviderInfo.value?.id, connectingProviderInfo.value?.id].includes(
          item.id
        )
    ) || null
  );
});


const isConnecting = computed((): boolean => connectingProviderInfo.value !== undefined);

const getButtonLoadingStatus = (item: WalletParameters): boolean => item.id === connectingProviderInfo.value?.id;

const getButtonSelectedStatus = (item: WalletParameters): boolean => [connectedProviderInfo.value?.id, connectingProviderInfo.value?.id].includes(item.id);

const getButtonDisabledStatus = (item: WalletParameters): boolean => {
  if (connectedProviderInfo.value || connectingProviderInfo.value) {
    return !getButtonSelectedStatus(item);
  }

  return false;
};

const clearData = () => {
  qrCodeDataURL.value = '';
  signature.value = '';
}

const connectWithWallet = async (parameters: WalletParameters) => {
  if (isConnecting.value) {
    return;
  }

  clearData();

  try {
    await connect(parameters);
  } catch {
    throw new Error('error connect to provider');
  }
};

const sign = async () => {
  signature.value = await signMessage('Some text...');
}

load();
tryConnectCachedProvider();
</script>

<template>
  <div class="web3-connect">
    <ul class="web3-connect__list" v-if="items.length">
      <li class="web3-connect__item" v-for="item in items" :key="item.id">
        <Web3ConnectButton
          :name="item.name"
          :image="item.image"
          :disabled="getButtonDisabledStatus(item)"
          :selected="getButtonSelectedStatus(item)"
          :loading="getButtonLoadingStatus(item)"
          @click="connectWithWallet(item)"
        />
      </li>
    </ul>

    <div class="web3-connect__body" v-if="currentProvider">
      <template v-if="isConnecting && qrCodeDataURL && walletConnectLink && !CoreUtil.isMobile()">
        <div class="web3-connect__qr-picture">
          <img class="web3-connect__qr-image" :src="qrCodeDataURL" alt="" />
          <img class="web3-connect__qr-logo" :src="currentProvider.image" alt="" />
        </div>
        <p class="web3-connect__text">
          Scan QR code in your wallet. Link: {{ walletConnectLink }}
        </p>
      </template>
      <template v-else>
        <img class="web3-connect__provider-image" :src="currentProvider?.image" alt="" />
        <p class="web3-connect__provider-name">
          {{ currentProvider?.name }}
        </p>
        <p class="web3-connect__provider-note">
          {{ isConnecting ? 'Connecting...' : 'The wallet is connected!' }}
        </p>
      </template>
      <template v-if="!isConnecting">
        <div class="web3-connect__buttons">
          <button class="web3-connect__button" type="button" @click="disconnect">
            Disconnect
          </button>
          <button class="web3-connect__button" type="button" @click="sign">
            Sign
          </button>
        </div>
        <p class="web3-connect__text" v-if="signature">
          Signature: {{ signature }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.web3-connect__list {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto 40px;
  padding: 0;
  list-style-type: none;
}

.web3-connect__item:not(:last-child) {
  margin: 0 0 8px;
}

.web3-connect__body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.web3-connect__qr-picture {
  position: relative;
  max-width: 200px;
  margin: 0 auto 24px;
}

.web3-connect__qr-image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}

.web3-connect__qr-logo {
  position: absolute;
  top: calc(50% - 16px);
  left: calc(50% - 16px);
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 50%;
}

.web3-connect__text {
  text-align: center;
  word-break: break-all;
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

.web3-connect__provider-image {
  display: block;
  width: 28px;
  height: 28px;
  margin: 0 auto 8px;
  border-radius: 50%;
}

.web3-connect__provider-name {
  display: block;
  margin: 0 0 16px;
}

.web3-connect__provider-note {
  margin: 0 0 24px;
}

.web3-connect__buttons {
  display: flex;
  flex-direction: column;
  margin: 0 0 24px;
}

.web3-connect__button {
  cursor: pointer;
}

.web3-connect__button:not(:last-child) {
  margin: 0 0 16px;
}
</style>
