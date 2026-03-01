<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import IngredientImage from "./IngredientImage.vue";
import type { IngredientLine, Recipe } from "@cookies-et-coquilettes/domain";

const props = defineProps<{
  visible: boolean;
  ingredient: IngredientLine | null;
  recipe: Recipe | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const displayIngredient = computed(() => props.ingredient);

function close() {
  emit("update:visible", false);
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="displayIngredient?.label ?? 'Ingrédient'"
    :style="{ width: 'min(90vw, 22rem)' }"
    :dismissable-mask="true"
    @update:visible="(v: boolean) => emit('update:visible', v)"
  >
    <template v-if="displayIngredient" #default>
      <div class="ingredient-detail-modal-content">
        <div class="ingredient-detail-modal-image">
          <IngredientImage
            :label="displayIngredient.label"
            :image-id="displayIngredient.imageId"
            img-class="ingredient-icon ingredient-icon--modal"
            fallback-class="ingredient-icon ingredient-icon--modal"
            :alt="`Ingrédient ${displayIngredient.label}`"
          />
        </div>
        <div class="ingredient-detail-modal-info">
          <p v-if="displayIngredient.quantity !== undefined" class="ingredient-detail-modal-qty">
            {{ displayIngredient.quantity }} {{ displayIngredient.unit ?? "" }}
          </p>
          <p v-if="displayIngredient.rawText" class="ingredient-detail-modal-raw muted">
            {{ displayIngredient.rawText }}
          </p>
        </div>
      </div>
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
  gap: 1rem;
}

.ingredient-detail-modal-image {
  display: flex;
  justify-content: center;
}

.ingredient-detail-modal-info {
  width: 100%;
  text-align: center;
}

.ingredient-detail-modal-qty {
  font-size: 1.1rem;
  margin: 0;
}

.ingredient-detail-modal-raw {
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
}
</style>
