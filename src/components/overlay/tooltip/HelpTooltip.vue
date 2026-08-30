<!-- src/components/overlay/tooltip/HelpTooltip.vue -->
<script setup lang="ts">
import { CircleHelp } from "@lucide/vue";
import { mergeProps } from "vue";
import type { HTMLAttributes } from "vue";

import ButtonIcon from "../../button/ButtonIcon.vue";
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
          <CircleHelp aria-hidden="true" class="size-3.5 text-accent" />
        </slot>
      </ButtonIcon>
    </template>
  </Tooltip>
</template>
