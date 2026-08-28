<!-- src/components/overlay/HelpTooltip.vue -->
<script setup lang="ts">
import { mergeProps } from "vue";
import type { HTMLAttributes } from "vue";

import ButtonIcon from "../button/ButtonIcon.vue";
import Tooltip from "./Tooltip.vue";

defineOptions({ inheritAttrs: false });

interface Props {
  content: string;
  /** 问号按钮的无障碍名称。 */
  label?: string;
  placement?: "top" | "bottom";
  disabled?: boolean;
  /** 调用方 class 作用于问号按钮。 */
  class?: HTMLAttributes["class"];
  /** 调用方 style 作用于问号按钮。 */
  style?: HTMLAttributes["style"];
  /** 调整提示内容卡片。 */
  contentClass?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  label: "查看说明",
  placement: "top",
  disabled: false,
  class: undefined,
  style: undefined,
  contentClass: undefined,
});

defineSlots<{
  icon?(): unknown;
}>();
</script>

<template>
  <Tooltip
    :content="props.content"
    :placement="props.placement"
    :disabled="props.disabled"
    :content-class="props.contentClass"
    open-on-click
  >
    <template #trigger="{ attrs, open }">
      <ButtonIcon
        v-bind="mergeProps($attrs, attrs)"
        :label="props.label"
        :disabled="props.disabled"
        :is-active="open"
        :class="['rounded-full', props.class]"
        :style="props.style"
      >
        <slot name="icon">
          <svg
            aria-hidden="true"
            class="size-3.5 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9.75 9a2.4 2.4 0 1 1 3.45 2.16c-.8.42-1.2.8-1.2 1.84" />
            <path d="M12 17h.01" />
          </svg>
        </slot>
      </ButtonIcon>
    </template>
  </Tooltip>
</template>
