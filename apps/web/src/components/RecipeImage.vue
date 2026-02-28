<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getImageBlobUrl } from "../services/recipe-service";

const props = withDefaults(
  defineProps<{
    imageId: string | undefined;
    alt?: string;
    imgClass?: string;
  }>(),
  { alt: "Photo de la recette" }
);

const blobUrl = ref<string | null>(null);

async function loadImage(id: string | undefined): Promise<void> {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
    blobUrl.value = null;
  }
  if (id) {
    blobUrl.value = (await getImageBlobUrl(id)) ?? null;
  }
}

onMounted(() => loadImage(props.imageId));
watch(() => props.imageId, (id) => loadImage(id));

onBeforeUnmount(() => {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value);
  }
});
</script>

<template>
  <img
    v-if="blobUrl"
    :src="blobUrl"
    :alt="alt"
    :class="imgClass"
    loading="lazy"
  />
</template>
