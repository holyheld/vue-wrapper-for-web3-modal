<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  name: string;
  image: string;
  disabled: boolean;
  selected: boolean;
  loading: boolean;
}

const props = defineProps<Props>();

const classList = computed(
  (): Record<string, boolean> => ({
    'web3-connect-button_selected': props.selected,
    'web3-connect-button_loading': props.loading,
    'web3-connect-button_disabled': props.disabled && !props.selected
  })
);
</script>

<template>
  <button
    class="web3-connect-button"
    :class="classList"
    :disabled="props.disabled || props.selected || props.loading"
    type="button"
  >
    <img :src="props.image" class="web3-connect-button__icon" alt="" />
    <span class="web3-connect-button__name">
      {{ props.name }}
    </span>
  </button>
</template>

<style scoped>
.web3-connect-button {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 8px 12px;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  text-align: left;
  background-color: transparent;
  border: none;
  cursor: pointer;
  appearance: none;
}


.web3-connect-button_selected {
  cursor: default;
  font-weight: bold;
}

.web3-connect-button_loading {
  cursor: wait;
}

.web3-connect-button_disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.web3-connect-button__icon {
  width: 28px;
  min-width: 28px;
  height: 28px;
  margin: 0 8px 0 0;
  border-radius: 50%;
}
</style>
