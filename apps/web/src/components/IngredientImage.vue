<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  getIngredientImageBlobUrl,
  resolveIngredientImageId
} from "../services/ingredient-image-service";

const props = defineProps<{
  label: string;
  imageId?: string;
  imgClass?: string;
  fallbackClass?: string;
  alt?: string;
}>();

const blobUrl = ref<string | null>(null);
const isLoading = ref(false);
let loadCounter = 0;

const altText = computed(() => props.alt ?? `Ingrédient ${props.label}`);

function clearBlobUrl(): void {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
    blobUrl.value = null;
  }
}

async function loadImage(): Promise<void> {
  const currentLoad = ++loadCounter;
  clearBlobUrl();

  const label = props.label.trim();
  if (!label) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  const resolvedId = await resolveIngredientImageId({
    label,
    imageId: props.imageId
  });

  if (currentLoad !== loadCounter) {
    return;
  }

  if (resolvedId) {
    blobUrl.value = (await getIngredientImageBlobUrl(resolvedId)) ?? null;
  } else {
    blobUrl.value = null;
  }

  isLoading.value = false;
}

watch(
  () => [props.label, props.imageId],
  () => {
    void loadImage();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearBlobUrl();
});
</script>

<template>
  <img
    v-if="blobUrl"
    :src="blobUrl"
    :alt="altText"
    :class="imgClass"
    loading="lazy"
  />
  <span
    v-else
    :class="['ingredient-image-fallback', fallbackClass, { 'ingredient-image-fallback--loading': isLoading }]"
    aria-hidden="true"
  >
    <i class="pi pi-image" />
  </span>
</template>
