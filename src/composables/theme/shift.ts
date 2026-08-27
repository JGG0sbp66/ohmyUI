// src/composables/theme/shift.ts
// 不是 composable：没有响应式状态，就是一对操作 <html> 的命令式函数

/** 压制期间挂在 <html> 上的状态类，规则见 styles/utilities.css */
const SHIFTING_CLASS = "theme-shifting";

let shiftTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * 开启压制窗口：换主题期间只让一个值动，其余元素瞬时跟随。
 * 不压的话带颜色过渡的元素会各按自己的时长去追插值，落后且互相错拍。
 *
 * 不会自动关，必须配 endShift —— 关窗时机各调用方不同：
 * 改色相是延时关，切深浅模式要等 View Transition 完成后才关。
 */
export function beginShift(): void {
  document.documentElement.classList.add(SHIFTING_CLASS);
}

/**
 * 排定关闭压制窗口。重复调用会重排定时器，
 * 所以拖动时每帧调一次，等价于「最后一次改动之后再等 delay」才恢复。
 *
 * @param delay 延时毫秒。0 表示尽快关，用于过渡已经跑完的场景
 */
export function endShift(delay = 0): void {
  clearTimeout(shiftTimer);
  shiftTimer = setTimeout(() => document.documentElement.classList.remove(SHIFTING_CLASS), delay);
}
