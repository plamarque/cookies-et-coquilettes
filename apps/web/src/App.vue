<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Button from "primevue/button";
import Card from "primevue/card";
import Chip from "primevue/chip";
import Tag from "primevue/tag";
import type {
  ImportSource,
  ParsedRecipeDraft,
  Recipe,
  RecipeCategory,
  RecipeFilters
} from "@cookies-et-coquilettes/domain";
import { isRecipeValidForSave } from "@cookies-et-coquilettes/domain";
import { dexieRecipeService } from "./services/recipe-service";
import { browserCookingModeService } from "./services/cooking-mode-service";
import { bffImportService } from "./services/import-service";

type ViewMode = "LIST" | "DETAIL" | "FORM";
type FormMode = "CREATE" | "EDIT" | "IMPORT_REVIEW";

interface IngredientInput {
  id: string;
  label: string;
  quantity: string;
  unit: string;
  isScalable: boolean;
}

interface StepInput {
  id: string;
  text: string;
}

interface RecipeFormState {
  title: string;
  category: RecipeCategory;
  favorite: boolean;
  servingsBase: string;
  prepTimeMin: string;
  cookTimeMin: string;
  ingredients: IngredientInput[];
  steps: StepInput[];
  source?: ImportSource;
}

const recipes = ref<Recipe[]>([]);
const selectedRecipeId = ref<string | null>(null);
const viewMode = ref<ViewMode>("LIST");
const formMode = ref<FormMode>("CREATE");
const formRecipeId = ref<string | null>(null);
const cookingState = ref<"OFF" | "WAKE_LOCK" | "FALLBACK">("OFF");
const feedback = ref<string>("");
const errorMessage = ref<string>("");

const search = ref("");
const categoryFilter = ref<"ALL" | RecipeCategory>("ALL");
const favoriteOnly = ref(false);

const importUrl = ref("");
const importText = ref("");
const importFile = ref<File | null>(null);
const importBusy = ref(false);

const servingsInput = ref("");

const form = ref<RecipeFormState>(emptyForm());

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyIngredient(): IngredientInput {
  return { id: randomId(), label: "", quantity: "", unit: "", isScalable: true };
}

function emptyStep(): StepInput {
  return { id: randomId(), text: "" };
}

function emptyForm(): RecipeFormState {
  return {
    title: "",
    category: "SALE",
    favorite: false,
    servingsBase: "",
    prepTimeMin: "",
    cookTimeMin: "",
    ingredients: [emptyIngredient()],
    steps: [emptyStep()]
  };
}

function parseNumber(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function toForm(recipe: Recipe): RecipeFormState {
  return {
    title: recipe.title,
    category: recipe.category,
    favorite: recipe.favorite,
    servingsBase: recipe.servingsBase ? String(recipe.servingsBase) : "",
    prepTimeMin: recipe.prepTimeMin ? String(recipe.prepTimeMin) : "",
    cookTimeMin: recipe.cookTimeMin ? String(recipe.cookTimeMin) : "",
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ingredient) => ({
            id: ingredient.id,
            label: ingredient.label,
            quantity:
              ingredient.quantity !== undefined ? String(ingredient.quantity) : "",
            unit: ingredient.unit ?? "",
            isScalable: ingredient.isScalable
          }))
        : [emptyIngredient()],
    steps:
      recipe.steps.length > 0
        ? recipe.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => ({ id: step.id, text: step.text }))
        : [emptyStep()],
    source: recipe.source
  };
}

function draftToForm(draft: ParsedRecipeDraft): RecipeFormState {
  return {
    title: draft.title,
    category: draft.category,
    favorite: false,
    servingsBase: draft.servingsBase ? String(draft.servingsBase) : "",
    prepTimeMin: draft.prepTimeMin ? String(draft.prepTimeMin) : "",
    cookTimeMin: draft.cookTimeMin ? String(draft.cookTimeMin) : "",
    ingredients:
      draft.ingredients.length > 0
        ? draft.ingredients.map((ingredient) => ({
            id: ingredient.id || randomId(),
            label: ingredient.label,
            quantity:
              ingredient.quantity !== undefined ? String(ingredient.quantity) : "",
            unit: ingredient.unit ?? "",
            isScalable: ingredient.isScalable
          }))
        : [emptyIngredient()],
    steps:
      draft.steps.length > 0
        ? draft.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => ({ id: step.id || randomId(), text: step.text }))
        : [emptyStep()],
    source: draft.source
  };
}

function formToRecipe(existing?: Recipe): Recipe {
  const now = new Date().toISOString();
  const servingsBase = parseNumber(form.value.servingsBase);
  const source = form.value.source
    ? {
        type: form.value.source.type,
        url: form.value.source.url,
        capturedAt: form.value.source.capturedAt
      }
    : existing?.source
      ? {
          type: existing.source.type,
          url: existing.source.url,
          capturedAt: existing.source.capturedAt
        }
      : undefined;
  const ingredients = form.value.ingredients
    .map((ingredient) => {
      const label = ingredient.label.trim();
      const quantity = parseNumber(ingredient.quantity);
      if (!label) {
        return null;
      }

      return {
        id: ingredient.id,
        label,
        quantity,
        quantityBase: ingredient.isScalable ? quantity : undefined,
        unit: ingredient.unit.trim() || undefined,
        isScalable: ingredient.isScalable,
        rawText: label
      };
    })
    .filter((ingredient): ingredient is NonNullable<typeof ingredient> => ingredient !== null);

  const steps = form.value.steps
    .map((step, index) => {
      const text = step.text.trim();
      if (!text) {
        return null;
      }
      return {
        id: step.id,
        order: index + 1,
        text
      };
    })
    .filter((step): step is NonNullable<typeof step> => step !== null);

  const recipe: Recipe = {
    id: existing?.id ?? randomId(),
    title: form.value.title.trim(),
    category: form.value.category,
    favorite: form.value.favorite,
    servingsBase,
    servingsCurrent: servingsBase,
    ingredients,
    steps,
    prepTimeMin: parseNumber(form.value.prepTimeMin),
    cookTimeMin: parseNumber(form.value.cookTimeMin),
    source,
    imageId: existing?.imageId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  if (!recipe.servingsBase) {
    delete recipe.servingsBase;
    delete recipe.servingsCurrent;
  }

  return recipe;
}

const selectedRecipe = computed(() =>
  recipes.value.find((recipe) => recipe.id === selectedRecipeId.value) ?? null
);

const favoriteCount = computed(() =>
  recipes.value.filter((recipe) => recipe.favorite).length
);

const activeFilters = computed<RecipeFilters>(() => ({
  category: categoryFilter.value === "ALL" ? undefined : categoryFilter.value,
  favorite: favoriteOnly.value ? true : undefined,
  search: search.value.trim() || undefined
}));

const canSaveForm = computed(() => {
  const candidate = formToRecipe(
    formMode.value === "EDIT" && formRecipeId.value
      ? recipes.value.find((recipe) => recipe.id === formRecipeId.value)
      : undefined
  );
  return isRecipeValidForSave(candidate);
});

async function refresh(): Promise<void> {
  recipes.value = await dexieRecipeService.listRecipes(activeFilters.value);
  if (selectedRecipeId.value) {
    const exists = recipes.value.some((recipe) => recipe.id === selectedRecipeId.value);
    if (!exists) {
      selectedRecipeId.value = null;
      viewMode.value = "LIST";
    }
  }
}

watch(activeFilters, async () => {
  await refresh();
});

function setError(error: unknown): void {
  errorMessage.value = error instanceof Error ? error.message : "Une erreur est survenue.";
  // eslint-disable-next-line no-console
  console.error(error);
}

function clearMessages(): void {
  feedback.value = "";
  errorMessage.value = "";
}

function openCreateForm(): void {
  clearMessages();
  formMode.value = "CREATE";
  formRecipeId.value = null;
  form.value = emptyForm();
  viewMode.value = "FORM";
}

function openEditForm(recipe: Recipe): void {
  clearMessages();
  formMode.value = "EDIT";
  formRecipeId.value = recipe.id;
  form.value = toForm(recipe);
  viewMode.value = "FORM";
}

function openImportReview(draft: ParsedRecipeDraft): void {
  clearMessages();
  formMode.value = "IMPORT_REVIEW";
  formRecipeId.value = null;
  form.value = draftToForm(draft);
  viewMode.value = "FORM";
}

function openDetail(recipe: Recipe): void {
  clearMessages();
  selectedRecipeId.value = recipe.id;
  servingsInput.value = recipe.servingsCurrent
    ? String(recipe.servingsCurrent)
    : recipe.servingsBase
      ? String(recipe.servingsBase)
      : "";
  viewMode.value = "DETAIL";
}

function backToList(): void {
  clearMessages();
  viewMode.value = "LIST";
  formRecipeId.value = null;
}

function addIngredient(): void {
  form.value.ingredients.push(emptyIngredient());
}

function removeIngredient(id: string): void {
  form.value.ingredients = form.value.ingredients.filter((ingredient) => ingredient.id !== id);
  if (form.value.ingredients.length === 0) {
    form.value.ingredients.push(emptyIngredient());
  }
}

function addStep(): void {
  form.value.steps.push(emptyStep());
}

function removeStep(id: string): void {
  form.value.steps = form.value.steps.filter((step) => step.id !== id);
  if (form.value.steps.length === 0) {
    form.value.steps.push(emptyStep());
  }
}

async function saveForm(): Promise<void> {
  clearMessages();
  try {
    const existing =
      formMode.value === "EDIT" && formRecipeId.value
        ? recipes.value.find((recipe) => recipe.id === formRecipeId.value)
        : undefined;
    const recipe = formToRecipe(existing);

    if (existing) {
      await dexieRecipeService.updateRecipe(existing.id, recipe);
      feedback.value = "Recette modifiée.";
      selectedRecipeId.value = existing.id;
    } else {
      await dexieRecipeService.createRecipe(recipe);
      feedback.value =
        formMode.value === "IMPORT_REVIEW"
          ? "Recette importée et enregistrée."
          : "Recette créée.";
      selectedRecipeId.value = recipe.id;
    }
    await refresh();
    viewMode.value = "DETAIL";
  } catch (error) {
    setError(error);
  }
}

async function deleteRecipe(recipe: Recipe): Promise<void> {
  clearMessages();
  const confirmed = window.confirm(
    `Supprimer définitivement "${recipe.title}" ? Cette action est irréversible.`
  );
  if (!confirmed) {
    return;
  }

  try {
    await dexieRecipeService.deleteRecipe(recipe.id);
    feedback.value = "Recette supprimée.";
    selectedRecipeId.value = null;
    viewMode.value = "LIST";
    await refresh();
  } catch (error) {
    setError(error);
  }
}

async function toggleFavorite(recipe: Recipe): Promise<void> {
  clearMessages();
  try {
    await dexieRecipeService.toggleFavorite(recipe.id);
    await refresh();
  } catch (error) {
    setError(error);
  }
}

async function scaleToInput(recipe: Recipe): Promise<void> {
  clearMessages();
  const target = parseNumber(servingsInput.value);
  if (!target) {
    setError(new Error("Nombre de portions invalide."));
    return;
  }

  try {
    const updated = await dexieRecipeService.scaleRecipe(recipe.id, target);
    servingsInput.value = String(updated.servingsCurrent ?? target);
    await refresh();
    selectedRecipeId.value = recipe.id;
  } catch (error) {
    setError(error);
  }
}

async function resetServings(recipe: Recipe): Promise<void> {
  if (!recipe.servingsBase) {
    return;
  }
  servingsInput.value = String(recipe.servingsBase);
  await scaleToInput(recipe);
}

async function toggleCookingMode(): Promise<void> {
  clearMessages();
  try {
    if (cookingState.value === "OFF") {
      const session = await browserCookingModeService.startCookingMode();
      cookingState.value = session.strategy;
      feedback.value =
        session.strategy === "WAKE_LOCK"
          ? "Mode cuisine actif (Wake Lock)."
          : "Mode cuisine actif (fallback navigateur).";
      return;
    }

    await browserCookingModeService.stopCookingMode();
    cookingState.value = "OFF";
    feedback.value = "Mode cuisine désactivé.";
  } catch (error) {
    setError(error);
  }
}

async function runImport(kind: "URL" | "TEXT" | "SCREENSHOT"): Promise<void> {
  clearMessages();
  importBusy.value = true;
  try {
    let draft: ParsedRecipeDraft;
    if (kind === "URL") {
      draft = await bffImportService.importFromUrl(importUrl.value.trim());
    } else if (kind === "TEXT") {
      draft = await bffImportService.importFromText(importText.value.trim());
    } else {
      if (!importFile.value) {
        throw new Error("Sélectionne une image.");
      }
      draft = await bffImportService.importFromScreenshot(importFile.value);
    }

    openImportReview(draft);
  } catch (error) {
    setError(error);
  } finally {
    importBusy.value = false;
  }
}

function onImportFileChanged(event: Event): void {
  const target = event.target as HTMLInputElement;
  importFile.value = target.files?.[0] ?? null;
}

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <main class="app-shell">
    <header class="hero">
      <p class="eyebrow">v1 solo local · offline-first</p>
      <h1>Cookies &amp; Coquillettes</h1>
      <p>Recettes locales, import assisté, recherche rapide et mode cuisine.</p>
      <div class="hero-actions">
        <Button
          :label="cookingState === 'OFF' ? 'Activer mode cuisine' : 'Désactiver mode cuisine'"
          :icon="cookingState === 'OFF' ? 'pi pi-moon' : 'pi pi-sun'"
          @click="toggleCookingMode"
        />
        <Button label="Nouvelle recette" icon="pi pi-plus" @click="openCreateForm" />
      </div>
    </header>

    <section class="stats">
      <Chip :label="`${recipes.length} recette(s)`" icon="pi pi-book" />
      <Chip :label="`${favoriteCount} favori(s)`" icon="pi pi-heart" />
      <Tag v-if="cookingState !== 'OFF'" severity="success" :value="cookingState" />
    </section>

    <section v-if="errorMessage" class="message error">{{ errorMessage }}</section>
    <section v-else-if="feedback" class="message success">{{ feedback }}</section>

    <section v-if="viewMode === 'LIST'" class="layout-grid">
      <Card class="panel">
        <template #title>Import assisté</template>
        <template #content>
          <div class="stack">
            <label for="import-url">URL</label>
            <input id="import-url" v-model="importUrl" type="url" placeholder="https://..." />
            <Button
              label="Importer depuis URL"
              icon="pi pi-link"
              :disabled="importBusy || !importUrl.trim()"
              @click="runImport('URL')"
            />
          </div>

          <div class="stack">
            <label for="import-text">Texte collé</label>
            <textarea
              id="import-text"
              v-model="importText"
              rows="4"
              placeholder="Colle une recette brute ici..."
            />
            <Button
              label="Importer depuis texte"
              icon="pi pi-file-edit"
              :disabled="importBusy || !importText.trim()"
              @click="runImport('TEXT')"
            />
          </div>

          <div class="stack">
            <label for="import-file">Capture d'écran</label>
            <input id="import-file" type="file" accept="image/*" @change="onImportFileChanged" />
            <Button
              label="Importer capture"
              icon="pi pi-image"
              :disabled="importBusy || !importFile"
              @click="runImport('SCREENSHOT')"
            />
          </div>
        </template>
      </Card>

      <Card class="panel">
        <template #title>Recherche et filtres</template>
        <template #content>
          <div class="stack">
            <label for="search">Recherche (titre + ingrédients)</label>
            <input id="search" v-model="search" type="search" placeholder="ex: chocolat" />
          </div>
          <div class="row">
            <label for="category-filter">Catégorie</label>
            <select id="category-filter" v-model="categoryFilter">
              <option value="ALL">Toutes</option>
              <option value="SUCRE">Sucré</option>
              <option value="SALE">Salé</option>
            </select>
            <label class="checkbox-line">
              <input v-model="favoriteOnly" type="checkbox" />
              Favoris uniquement
            </label>
          </div>
        </template>
      </Card>

      <section class="grid">
        <Card
          v-for="recipe in recipes"
          :key="recipe.id"
          class="recipe-card"
          @click="openDetail(recipe)"
        >
          <template #title>{{ recipe.title }}</template>
          <template #subtitle>
            {{ recipe.category }} · modifiée {{ new Date(recipe.updatedAt).toLocaleString("fr-FR") }}
          </template>
          <template #content>
            <p>{{ recipe.ingredients.length }} ingrédient(s)</p>
            <p>{{ recipe.steps.length }} étape(s)</p>
            <div class="row">
              <Tag v-if="recipe.favorite" value="Favori" />
              <Button
                text
                size="small"
                icon="pi pi-heart"
                :label="recipe.favorite ? 'Retirer favori' : 'Ajouter favori'"
                @click.stop="toggleFavorite(recipe)"
              />
            </div>
          </template>
        </Card>

        <Card v-if="recipes.length === 0" class="recipe-card empty-card">
          <template #title>Aucune recette</template>
          <template #content>
            <p>Ajoute une recette via import assisté ou création manuelle.</p>
          </template>
        </Card>
      </section>
    </section>

    <section v-else-if="viewMode === 'DETAIL' && selectedRecipe" class="panel detail">
      <div class="row between">
        <h2>{{ selectedRecipe.title }}</h2>
        <div class="row">
          <Button label="Retour" text icon="pi pi-arrow-left" @click="backToList" />
          <Button label="Éditer" text icon="pi pi-pencil" @click="openEditForm(selectedRecipe)" />
          <Button
            :label="selectedRecipe.favorite ? 'Retirer favori' : 'Favori'"
            text
            icon="pi pi-heart"
            @click="toggleFavorite(selectedRecipe)"
          />
          <Button
            severity="danger"
            text
            icon="pi pi-trash"
            label="Supprimer"
            @click="deleteRecipe(selectedRecipe)"
          />
        </div>
      </div>

      <p class="muted">
        {{ selectedRecipe.category }} · base:
        {{ selectedRecipe.servingsBase ? `${selectedRecipe.servingsBase} portions` : "non définie" }}
      </p>

      <div v-if="selectedRecipe.servingsBase" class="servings-tools">
        <label for="servings-input">Portions</label>
        <input id="servings-input" v-model="servingsInput" type="number" min="1" step="1" />
        <Button label="Appliquer" @click="scaleToInput(selectedRecipe)" />
        <Button label="Reset base" text @click="resetServings(selectedRecipe)" />
      </div>

      <h3>Ingrédients</h3>
      <ul>
        <li v-for="ingredient in selectedRecipe.ingredients" :key="ingredient.id">
          <strong>{{ ingredient.label }}</strong>
          <span v-if="ingredient.quantity !== undefined">
            : {{ ingredient.quantity }} {{ ingredient.unit ?? "" }}
          </span>
        </li>
      </ul>

      <h3>Étapes</h3>
      <ol>
        <li v-for="step in selectedRecipe.steps" :key="step.id">{{ step.text }}</li>
      </ol>
    </section>

    <section v-else-if="viewMode === 'FORM'" class="panel form-panel">
      <div class="row between">
        <h2>
          {{
            formMode === "IMPORT_REVIEW"
              ? "Revue d'import (obligatoire)"
              : formMode === "EDIT"
                ? "Éditer recette"
                : "Nouvelle recette"
          }}
        </h2>
        <Button label="Annuler" text icon="pi pi-times" @click="backToList" />
      </div>

      <div class="stack">
        <label for="title">Titre</label>
        <input id="title" v-model="form.title" type="text" placeholder="Ex: Cookies noisette" />
      </div>

      <div class="row">
        <div class="stack">
          <label for="category">Catégorie</label>
          <select id="category" v-model="form.category">
            <option value="SUCRE">Sucré</option>
            <option value="SALE">Salé</option>
          </select>
        </div>
        <label class="checkbox-line">
          <input v-model="form.favorite" type="checkbox" />
          Favori
        </label>
      </div>

      <div class="row">
        <div class="stack">
          <label for="servingsBase">Portions de base</label>
          <input id="servingsBase" v-model="form.servingsBase" type="number" min="1" step="1" />
        </div>
        <div class="stack">
          <label for="prepTime">Préparation (min)</label>
          <input id="prepTime" v-model="form.prepTimeMin" type="number" min="1" step="1" />
        </div>
        <div class="stack">
          <label for="cookTime">Cuisson (min)</label>
          <input id="cookTime" v-model="form.cookTimeMin" type="number" min="1" step="1" />
        </div>
      </div>

      <h3>Ingrédients</h3>
      <div v-for="ingredient in form.ingredients" :key="ingredient.id" class="ingredient-row">
        <input
          v-model="ingredient.label"
          type="text"
          placeholder="Nom ingrédient"
          :aria-label="`ingredient-label-${ingredient.id}`"
        />
        <input
          v-model="ingredient.quantity"
          type="text"
          placeholder="Qté"
          :aria-label="`ingredient-quantity-${ingredient.id}`"
        />
        <input
          v-model="ingredient.unit"
          type="text"
          placeholder="Unité"
          :aria-label="`ingredient-unit-${ingredient.id}`"
        />
        <label class="checkbox-line">
          <input v-model="ingredient.isScalable" type="checkbox" />
          Scalable
        </label>
        <Button text icon="pi pi-trash" @click="removeIngredient(ingredient.id)" />
      </div>
      <Button text icon="pi pi-plus" label="Ajouter ingrédient" @click="addIngredient" />

      <h3>Étapes</h3>
      <div v-for="step in form.steps" :key="step.id" class="step-row">
        <textarea
          v-model="step.text"
          rows="2"
          placeholder="Décris l'étape"
          :aria-label="`step-text-${step.id}`"
        />
        <Button text icon="pi pi-trash" @click="removeStep(step.id)" />
      </div>
      <Button text icon="pi pi-plus" label="Ajouter étape" @click="addStep" />

      <div class="row between">
        <p class="muted">Règle v1: titre + au moins un ingrédient ou une étape.</p>
        <Button
          label="Enregistrer"
          icon="pi pi-check"
          :disabled="!canSaveForm"
          @click="saveForm"
        />
      </div>
    </section>
  </main>
</template>
