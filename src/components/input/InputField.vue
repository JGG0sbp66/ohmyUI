<!-- src/components/input/InputField.vue -->
<script setup lang="ts">
import { computed, useId } from "vue";

interface Props {
  /** 显式指定原生控件 id；未传时自动生成。 */
  id?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

interface FieldControlAttrs {
  id: string;
  disabled?: true;
  required?: true;
  invalid: boolean;
  "aria-invalid"?: "true";
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  label: undefined,
  description: undefined,
  error: undefined,
  required: false,
  disabled: false,
});

defineSlots<{
  default(props: { controlAttrs: FieldControlAttrs }): unknown;
  label?(): unknown;
  hint?(): unknown;
}>();

const generatedId = useId();
const controlId = computed(() => props.id ?? `input-${generatedId}`);
const descriptionId = computed(() => `${controlId.value}-description`);
const errorId = computed(() => `${controlId.value}-error`);

const describedBy = computed(() => {
  const ids = [
    props.description ? descriptionId.value : "",
    props.error ? errorId.value : "",
  ].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
});

const controlAttrs = computed<FieldControlAttrs>(() => ({
  id: controlId.value,
  disabled: props.disabled || undefined,
  required: props.required || undefined,
  invalid: Boolean(props.error),
  "aria-invalid": props.error ? "true" : undefined,
  "aria-describedby": describedBy.value,
  "aria-errormessage": props.error ? errorId.value : undefined,
}));
</script>

<template>
  <div class="flex w-full flex-col text-left">
    <div
      v-if="props.label || $slots.label || $slots.hint"
      class="mb-2 flex items-center gap-1.5 px-1"
    >
      <label
        v-if="props.label || $slots.label"
        :for="controlId"
        class="text-sm font-bold tracking-wider text-fg-subtle uppercase select-none"
      >
        <slot name="label">{{ props.label }}</slot>
        <span v-if="props.required" class="ml-0.5 text-danger">*</span>
      </label>

      <slot name="hint" />
    </div>

    <slot :control-attrs="controlAttrs" />

    <p
      v-if="props.description"
      :id="descriptionId"
      class="mt-1 px-1 text-[10px] leading-tight text-fg-soft"
    >
      {{ props.description }}
    </p>

    <div
      class="grid transition-[grid-template-rows] motion-reduce:transition-none"
      :class="props.error ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      aria-live="polite"
    >
      <div class="min-h-0 overflow-hidden">
        <p
          :id="errorId"
          class="mt-1 px-1 text-[10px] leading-tight text-danger transition-opacity motion-reduce:transition-none"
          :class="props.error ? 'opacity-100' : 'opacity-0'"
        >
          {{ props.error }}
        </p>
      </div>
    </div>
  </div>
</template>
