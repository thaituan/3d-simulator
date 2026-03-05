/**
 * 色温度（Kelvin）をRGB色に変換する
 *
 * @param kelvin - 色温度（1000K～40000K）
 * @returns RGB色の16進数表記（例: "#ff9329"）
 *
 */
export function kelvinToRGB(kelvin: number): string {
  // 100で割って計算（元のアルゴリズムに従う）
  const temp = kelvin / 100;

  let r: number, g: number, b: number;

  // 赤の計算
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  // 緑の計算
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));

  // 青の計算
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  // 16進数に変換
  const rHex = Math.round(r).toString(16).padStart(2, "0");
  const gHex = Math.round(g).toString(16).padStart(2, "0");
  const bHex = Math.round(b).toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}
