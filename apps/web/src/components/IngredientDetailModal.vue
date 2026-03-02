<script setup lang="ts">
import { computed, ref } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import IngredientImage from "./IngredientImage.vue";
import type { IngredientLine, Recipe } from "@cookies-et-coquilettes/domain";
import {
  normalizeIngredientImageId,
  storeIngredientImageFromFile
} from "../services/ingredient-image-service";

const props = defineProps<{
  visible: boolean;
  ingredient: IngredientLine | null;
  recipe: Recipe | null;
  refreshKey?: number;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  imageUpdated: [];
}>();

const displayIngredient = computed(() => props.ingredient);
const fileInputRef = ref<HTMLInputElement | null>(null);

function close() {
  emit("update:visible", false);
}

function getImageId(): string | null {
  const ing = displayIngredient.value;
  if (!ing?.label?.trim()) return null;
  const explicitId = ing.imageId?.trim();
  const normalizedId = normalizeIngredientImageId(ing.label);
  return explicitId || normalizedId || null;
}

function triggerFilePick() {
  fileInputRef.value?.click();
}

async function onFilePicked(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const id = getImageId();
  if (!id) return;
  try {
    const result = await storeIngredientImageFromFile(id, file);
    if (result) {
      emit("imageUpdated");
    }
  } finally {
    // reset so same file can be picked again
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="displayIngredient?.label ?? 'Ingrédient'"
    :style="{ width: 'min(95vw, 28rem)' }"
    :content-style="{ padding: '0.5rem 1rem 1rem' }"
    :dismissable-mask="true"
    class="ingredient-detail-dialog"
    @update:visible="(v: boolean) => emit('update:visible', v)"
  >
    <template v-if="displayIngredient" #default>
      <div class="ingredient-detail-modal-content">
        <div class="ingredient-detail-modal-image">
          <IngredientImage
            :label="displayIngredient.label"
            :image-id="displayIngredient.imageId"
            :refresh-key="refreshKey"
            img-class="ingredient-icon ingredient-icon--modal"
            fallback-class="ingredient-icon ingredient-icon--modal"
            :alt="`Ingrédient ${displayIngredient.label}`"
          />
        </div>
        <div class="ingredient-detail-modal-info">
          <h3 class="ingredient-detail-modal-name">{{ displayIngredient.label }}</h3>
          <p v-if="displayIngredient.quantity !== undefined" class="ingredient-detail-modal-qty">
            {{ displayIngredient.quantity }} {{ displayIngredient.unit ?? "" }}
          </p>
          <p v-if="displayIngredient.rawText" class="ingredient-detail-modal-raw muted">
            {{ displayIngredient.rawText }}
          </p>
        </div>
        <div class="ingredient-detail-modal-actions">
          <Button
            label="Choisir une image"
            icon="pi pi-upload"
            size="small"
            severity="secondary"
            @click="triggerFilePick"
          />
        </div>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden-file-input"
        aria-hidden="true"
        @change="onFilePicked"
      />
    </template>
    <template #footer>
      <Button label="Fermer" @click="close" />
    </template>
  </Dialog>
</template>

<style scoped>
.ingredient-detail-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.ingredient-detail-modal-image {
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 14rem;
}

.ingredient-detail-modal-image :deep(.ingredient-icon--modal) {
  width: 14rem;
  height: 14rem;
  max-width: 100%;
}

.ingredient-detail-modal-info {
  width: 100%;
  text-align: center;
}

.ingredient-detail-modal-name {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  line-height: 1.3;
}

.ingredient-detail-modal-qty {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: var(--p-text-color);
}

.ingredient-detail-modal-raw {
  font-size: 0.95rem;
  margin: 0.5rem 0 0;
}

.ingredient-detail-modal-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.hidden-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
