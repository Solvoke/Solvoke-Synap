/**
 * ID 生成工具
 *
 * 基于 nanoid 封装，统一项目中所有 ID 的生成方式。
 * nanoid 生成 21 位 URL 友好的唯一字符串，碰撞概率极低。
 */
import { nanoid } from 'nanoid';

/** 默认 ID 长度 */
const DEFAULT_ID_LENGTH = 21;

/** 生成唯一 ID */
export function generateId(size: number = DEFAULT_ID_LENGTH): string {
  return nanoid(size);
}
