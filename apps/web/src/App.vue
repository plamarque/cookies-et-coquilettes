<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Button from "primevue/button";
import Card from "primevue/card";
import ProgressSpinner from "primevue/progressspinner";
import Tag from "primevue/tag";
import type {
  ImportSource,
  ParsedRecipeDraft,
  Recipe,
  RecipeCategory,
  RecipeFilters
} from "@cookies-et-coquilettes/domain";
import { isRecipeValidForSave } from "@cookies-et-coquilettes/domain";
import RecipeImage from "./components/RecipeImage.vue";
import { dexieRecipeService, storeImageFromFile, storeImageFromUrl } from "./services/recipe-service";
import { db } from "./storage/db";
import { browserCookingModeService } from "./services/cooking-mode-service";
import { bffImportService } from "./services/import-service";

type ViewMode = "LIST" | "DETAIL" | "FORM" | "ADD_CHOICE";
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
  imageUrl?: string;
  imageId?: string | null;
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

const fileInputRef = ref<HTMLInputElement | null>(null);
const formImageInputRef = ref<HTMLInputElement | null>(null);
const pasteFieldContent = ref("");
const importBusy = ref(false);
const importSourceType = ref<"url" | "text" | "file" | null>(null);

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
    source: recipe.source,
    imageId: recipe.imageId
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
    imageUrl: draft.imageUrl,
    imageId: undefined,
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
    imageId:
      form.value.imageId === null
        ? undefined
        : form.value.imageId ?? existing?.imageId,
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

function openAddChoice(): void {
  clearMessages();
  pasteFieldContent.value = "";
  viewMode.value = "ADD_CHOICE";
}

function closeAddChoice(): void {
  clearMessages();
  pasteFieldContent.value = "";
  viewMode.value = "LIST";
}

function triggerFilePick(): void {
  fileInputRef.value?.click();
}

function isLikelyUrl(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

async function runImportFromPasteField(): Promise<void> {
  const content = pasteFieldContent.value.trim();
  if (!content) {
    setError(new Error("Collez une URL ou du texte à importer."));
    return;
  }

  clearMessages();
  importBusy.value = true;
  importSourceType.value = isLikelyUrl(content) ? "url" : "text";
  try {
    let draft: ParsedRecipeDraft;
    if (importSourceType.value === "url") {
      draft = await bffImportService.importFromUrl(content);
    } else {
      draft = await bffImportService.importFromText(content);
    }
    pasteFieldContent.value = "";
    openImportReview(draft);
  } catch (error) {
    setError(error);
  } finally {
    importBusy.value = false;
    importSourceType.value = null;
  }
}

function onPasteInField(ev: ClipboardEvent): void {
  const data = ev.clipboardData;
  if (!data) return;

  const imageType = [...data.types].find((t) => t.startsWith("image/"));
  if (imageType) {
    ev.preventDefault();
    const file = data.files?.[0];
    if (file) {
      runImportFromFile(file);
    }
  }
}

async function runImportFromFile(file: File): Promise<void> {
  clearMessages();
  importBusy.value = true;
  importSourceType.value = "file";
  try {
    let draft: ParsedRecipeDraft;
    if (file.type.startsWith("image/")) {
      draft = await bffImportService.importFromScreenshot(file);
    } else {
      const text = await file.text();
      draft = await bffImportService.importFromText(text);
    }
    openImportReview(draft);
  } catch (error) {
    setError(error);
  } finally {
    importBusy.value = false;
    importSourceType.value = null;
  }
}

function onFilePicked(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    runImportFromFile(file);
  }
  target.value = "";
}

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

async function openEditForm(recipe: Recipe): Promise<void> {
  clearMessages();
  await stopCookingModeIfActive();
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

async function backToList(): Promise<void> {
  clearMessages();
  if (viewMode.value === "DETAIL") {
    await stopCookingModeIfActive();
  }
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

function triggerFormImagePick(): void {
  formImageInputRef.value?.click();
}

async function onFormImagePicked(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file?.type.startsWith("image/")) return;
  const imageId = await storeImageFromFile(file);
  if (imageId) {
    form.value.imageId = imageId;
    form.value.imageUrl = undefined;
  }
}

function removeFormImage(): void {
  form.value.imageId = null;
  form.value.imageUrl = undefined;
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
    let recipe = formToRecipe(existing);

    if (!recipe.imageId && !existing && form.value.imageUrl) {
      const imageId = await storeImageFromUrl(form.value.imageUrl);
      if (imageId) {
        recipe = { ...recipe, imageId };
      }
    }

    if (existing) {
      if (existing.imageId && !recipe.imageId) {
        await db.images.delete(existing.imageId);
      }
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
    await stopCookingModeIfActive();
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

async function stopCookingModeIfActive(): Promise<void> {
  if (cookingState.value !== "OFF") {
    try {
      await browserCookingModeService.stopCookingMode();
      cookingState.value = "OFF";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("stopCookingMode failed", error);
    }
  }
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

onMounted(async () => {
  await refresh();
});
</script>

<template>
  <main class="app-shell">
    <section v-if="errorMessage" class="message error">{{ errorMessage }}</section>
    <section v-else-if="feedback" class="message success">{{ feedback }}</section>

    <section v-if="viewMode === 'LIST'" class="list-view">
      <div class="toolbar">
        <div class="filters">
          <input
            id="search"
            v-model="search"
            type="search"
            placeholder="Rechercher..."
            class="search-input"
          />
          <div class="filter-chips">
            <Button
              :severity="favoriteOnly ? 'primary' : 'secondary'"
              :label="`Favoris (${favoriteCount})`"
              size="small"
              icon="pi pi-heart"
              @click="favoriteOnly = !favoriteOnly"
            />
            <Button
              :severity="categoryFilter === 'SUCRE' ? 'primary' : 'secondary'"
              label="Sucré"
              size="small"
              @click="categoryFilter = categoryFilter === 'SUCRE' ? 'ALL' : 'SUCRE'"
            />
            <Button
              :severity="categoryFilter === 'SALE' ? 'primary' : 'secondary'"
              label="Salé"
              size="small"
              @click="categoryFilter = categoryFilter === 'SALE' ? 'ALL' : 'SALE'"
            />
          </div>
        </div>
        <div class="toolbar-actions">
          <Button
            label="Nouvelle recette"
            icon="pi pi-plus"
            rounded
            :loading="importBusy"
            @click="openAddChoice"
          />
        </div>
      </div>

      <section class="grid">
        <Card
          v-for="recipe in recipes"
          :key="recipe.id"
          class="recipe-card"
          @click="openDetail(recipe)"
        >
          <template #header>
            <RecipeImage
              v-if="recipe.imageId"
              :image-id="recipe.imageId"
              img-class="recipe-card-image"
            />
          </template>
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
            <p>Cliquez sur « Nouvelle recette » pour saisir à la main ou importer (coller / fichier).</p>
          </template>
        </Card>
      </section>
    </section>

    <section v-else-if="viewMode === 'ADD_CHOICE'" class="panel add-choice-panel">
      <div class="row between">
        <h2>Nouvelle recette</h2>
        <Button label="Annuler" text icon="pi pi-times" @click="closeAddChoice" />
      </div>

      <div
        v-if="importBusy && importSourceType === 'url'"
        class="import-analyzing"
        aria-live="polite"
      >
        <ProgressSpinner style="width: 2.5rem; height: 2.5rem" strokeWidth="4" />
        <p>Analyse de la recette en cours…</p>
      </div>

      <div class="stack">
        <label for="paste-field">Collez une URL, du texte ou une image</label>
        <textarea
          id="paste-field"
          v-model="pasteFieldContent"
          class="paste-field"
          rows="4"
          placeholder="Collez ici une URL, du texte de recette ou une image..."
          @paste="onPasteInField"
        />
        <Button
          label="Importer"
          icon="pi pi-download"
          :disabled="importBusy || !pasteFieldContent.trim()"
          @click="runImportFromPasteField"
        />
      </div>

      <div class="add-choice-buttons">
        <Button
          label="Saisir à la main"
          icon="pi pi-pencil"
          @click="openCreateForm"
        />
        <Button
          label="Choisir un fichier"
          icon="pi pi-folder-open"
          :disabled="importBusy"
          @click="triggerFilePick"
        />
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*,.txt,text/plain,text/html"
        class="hidden-file-input"
        @change="onFilePicked"
      />
    </section>

    <section v-else-if="viewMode === 'DETAIL' && selectedRecipe" class="panel detail">
      <RecipeImage
        v-if="selectedRecipe.imageId"
        :image-id="selectedRecipe.imageId"
        img-class="recipe-detail-image"
      />
      <div class="row between">
        <h2>{{ selectedRecipe.title }}</h2>
        <div class="row">
          <Button label="Retour" text icon="pi pi-arrow-left" @click="backToList" />
          <Button
            :icon="cookingState === 'OFF' ? 'pi pi-moon' : 'pi pi-sun'"
            :label="cookingState === 'OFF' ? 'Mode cuisine' : 'Mode cuisine'"
            text
            :title="cookingState === 'OFF' ? 'Activer mode cuisine' : 'Désactiver mode cuisine'"
            @click="toggleCookingMode"
          />
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

      <div class="stack">
        <label>Image</label>
        <div v-if="form.imageUrl || (form.imageId && typeof form.imageId === 'string')" class="row" style="align-items: flex-start">
          <RecipeImage
            v-if="form.imageId && typeof form.imageId === 'string'"
            :image-id="form.imageId"
            img-class="recipe-form-image"
          />
          <img
            v-else-if="form.imageUrl"
            :src="form.imageUrl"
            alt="Aperçu import"
            class="recipe-form-image"
          />
          <div class="row" style="gap: 0.5rem; margin-left: 0.5rem">
            <Button
              text
              size="small"
              icon="pi pi-upload"
              label="Changer"
              @click="triggerFormImagePick"
            />
            <Button
              text
              size="small"
              severity="secondary"
              icon="pi pi-times"
              label="Supprimer"
              @click="removeFormImage"
            />
          </div>
        </div>
        <Button
          v-else
          text
          size="small"
          icon="pi pi-image"
          label="Ajouter une image"
          @click="triggerFormImagePick"
        />
        <input
          ref="formImageInputRef"
          type="file"
          accept="image/*"
          class="hidden-file-input"
          @change="onFormImagePicked"
        />
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
