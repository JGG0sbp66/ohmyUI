<script setup lang="ts">
import { ChevronDown, Search } from "@lucide/vue";
import type { HTMLAttributes } from "vue";

import Loading from "../../feedback/Loading.vue";
import ControlClearButton from "../../internal/control/ControlClearButton.vue";
import ControlFrame from "../../internal/control/ControlFrame.vue";

const props = withDefaults(
  defineProps<{
    query: string;
    inputAttrs: Record<string, unknown>;
    disabled?: boolean;
    invalid?: boolean;
    block?: boolean;
    clearable?: boolean;
    clearLabel?: string;
    loading?: boolean;
    loadingLabel?: string;
    expanded?: boolean;
    hasValue?: boolean;
    rootClass?: HTMLAttributes["class"];
    rootStyle?: HTMLAttributes["style"];
    inputClass?: HTMLAttributes["class"];
  }>(),
  {
    disabled: false,
    invalid: false,
    block: false,
    clearable: false,
    clearLabel: "清除输入",
    loading: false,
    loadingLabel: "正在加载",
    expanded: false,
    hasValue: false,
    rootClass: undefined,
    rootStyle: undefined,
    inputClass: undefined,
  },
);

const emit = defineEmits<{ clear: [] }>();

defineSlots<{
  prefix?(): unknown;
  suffix?(): unknown;
  "clear-icon"?(): unknown;
}>();
</script>

<template>
  <ControlFrame
    data-ohmyui-combobox-control
    :aria-busy="props.loading || undefined"
    :root-class="['group/combobox', props.block ? 'w-full' : 'w-full max-w-64', props.rootClass]"
    :root-style="props.rootStyle"
    :disabled="props.disabled"
    :invalid="props.invalid"
  >
    <span
      aria-hidden="true"
      class="ml-3 size-4 shrink-0 text-fg-soft transition-colors group-focus-within/combobox:text-fg-subtle motion-reduce:transition-none"
    >
      <slot name="prefix"><Search aria-hidden="true" class="size-4" /></slot>
    </span>

    <input
      v-bind="props.inputAttrs"
      :value="props.query"
      type="text"
      :disabled="props.disabled"
      :class="[
        'min-h-10 min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm font-normal outline-none placeholder:text-fg-soft',
        props.disabled ? 'cursor-not-allowed' : '',
        props.inputClass,
      ]"
    />

    <slot name="suffix" />

    <span v-if="props.loading" class="mr-1 flex size-4 shrink-0 items-center text-fg-soft">
      <Loading />
    </span>

    <ControlClearButton
      v-if="props.clearable && props.hasValue"
      :label="props.clearLabel"
      :disabled="props.disabled"
      class="mr-1"
      @clear="emit('clear')"
    >
      <template v-if="$slots['clear-icon']" #default><slot name="clear-icon" /></template>
    </ControlClearButton>

    <ChevronDown
      aria-hidden="true"
      class="mr-3 size-3.5 shrink-0 text-fg-soft transition-transform motion-reduce:transition-none"
      :class="props.expanded ? 'rotate-180' : ''"
    />

    <span role="status" aria-live="polite" aria-atomic="true" class="sr-only">
      {{ props.loading && !props.expanded ? props.loadingLabel : "" }}
    </span>
  </ControlFrame>
</template>
