import type { InjectionKey } from "vue";

export interface DropdownMenuContext {
  close: () => void;
}

export const DROPDOWN_MENU_CONTEXT: InjectionKey<DropdownMenuContext> =
  Symbol("ohmyui-dropdown-menu");
