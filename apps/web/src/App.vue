<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Button from "primevue/button";
import Card from "primevue/card";
import Chip from "primevue/chip";
import Tag from "primevue/tag";
import type { Recipe } from "@cookies-et-coquilettes/domain";
import { dexieRecipeService } from "./services/recipe-service";
import { browserCookingModeService } from "./services/cooking-mode-service";

const recipes = ref<Recipe[]>([]);
const cookingState = ref<"OFF" | "WAKE_LOCK" | "FALLBACK">("OFF");

const favoriteCount = computed(() =>
  recipes.value.filter((recipe) => recipe.favorite).length
);

async function refresh() {
  recipes.value = await dexieRecipeService.listRecipes();
}

async function toggleCookingMode() {
  if (cookingState.value === "OFF") {
    const session = await browserCookingModeService.startCookingMode();
    cookingState.value = session.strategy;
    return;
  }

  await browserCookingModeService.stopCookingMode();
  cookingState.value = "OFF";
}

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <main class="app-shell">
    <header class="hero">
      <p class="eyebrow">PWA mobile-first</p>
      <h1>Cookies &amp; Coquillettes</h1>
      <p>
        Base initialisée avec Vue, TypeScript, PrimeVue, IndexedDB (Dexie) et
        services v1.
      </p>
      <div class="hero-actions">
        <Button
          :label="cookingState === 'OFF' ? 'Activer mode cuisine' : 'Désactiver mode cuisine'"
          :icon="cookingState === 'OFF' ? 'pi pi-moon' : 'pi pi-sun'"
          @click="toggleCookingMode"
        />
        <Tag v-if="cookingState !== 'OFF'" severity="success" :value="cookingState" />
      </div>
    </header>

    <section class="stats">
      <Chip :label="`${recipes.length} recette(s)`" icon="pi pi-book" />
      <Chip :label="`${favoriteCount} favori(s)`" icon="pi pi-heart" />
    </section>

    <section class="grid">
      <Card v-for="recipe in recipes" :key="recipe.id" class="recipe-card">
        <template #title>{{ recipe.title }}</template>
        <template #subtitle>{{ recipe.category }}</template>
        <template #content>
          <p>{{ recipe.ingredients.length }} ingrédient(s)</p>
          <p>{{ recipe.steps.length }} étape(s)</p>
          <Tag v-if="recipe.favorite" value="Favori" />
        </template>
      </Card>

      <Card v-if="recipes.length === 0" class="recipe-card empty-card">
        <template #title>Aucune recette</template>
        <template #content>
          <p>Ajoute une recette via import ou saisie manuelle.</p>
        </template>
      </Card>
    </section>
  </main>
</template>
