<script setup lang="ts">
import { computed, useAttrs } from "vue";

import SelectRoot from "./internal/SelectRoot.vue";
import type { SelectProps, SelectRootProps, SelectValue } from "./select.types";

defineOptions({ inheritAttrs: false });

const props = defineProps<SelectProps>();
const emit = defineEmits<{
  change: [value: SelectValue | null];
  "open-change": [open: boolean];
}>();
const model = defineModel<SelectValue | null>({ default: null });
const open = defineModel<boolean>("open", { default: false });
const attrs = useAttrs();

const rootProps = computed<SelectRootProps>(() => {
  const { options, ...common } = props;
  return {
    ...common,
    groups: [{ key: "options", options }],
  };
});
const rootBindings = computed<SelectRootProps & Record<string, unknown>>(() => ({
  ...attrs,
  ...rootProps.value,
}));
</script>

<template>
  <SelectRoot
    v-bind="rootBindings"
    v-model="model"
    v-model:open="open"
    @change="emit('change', $event)"
    @open-change="emit('open-change', $event)"
  />
</template>
