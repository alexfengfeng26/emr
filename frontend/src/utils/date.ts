/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期
 * @param date 日期字符串或日期对象
 * @param format 格式化字符串，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化为简短日期
 * @param date 日期字符串或日期对象
 * @returns 格式化后的日期字符串，格式：YYYY-MM-DD
 */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'YYYY-MM-DD')
}

/**
 * 格式化为时间
 * @param date 日期字符串或日期对象
 * @returns 格式化后的时间字符串，格式：HH:mm:ss
 */
export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm:ss')
}

/**
 * 获取相对时间
 * @param date 日期字符串或日期对象
 * @returns 相对时间描述
 */
export function getRelativeTime(date: string | Date): string {
  if (!date) return ''

  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()

  if (diff < 0) return '未来时间'

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return formatDateShort(date)
}

/**
 * 获取时间段描述
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 时间段描述
 */
export function getTimeRange(startTime: string | Date, endTime: string | Date): string {
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return ''

  const diff = end.getTime() - start.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  let result = ''
  if (days > 0) result += `${days}天`
  if (hours > 0) result += `${hours}小时`
  if (minutes > 0) result += `${minutes}分钟`

  return result || '0分钟'
}

/**
 * 是否为今天
 * @param date 日期字符串或日期对象
 * @returns 是否为今天
 */
export function isToday(date: string | Date): boolean {
  const d = new Date(date)
  const today = new Date()

  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate()
}

/**
 * 是否为本周
 * @param date 日期字符串或日期对象
 * @returns 是否为本周
 */
export function isThisWeek(date: string | Date): boolean {
  const d = new Date(date)
  const today = new Date()

  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  return d >= startOfWeek && d <= endOfWeek
}

/**
 * 获取月份的第一天
 * @param date 日期字符串或日期对象
 * @returns 月份的第一天
 */
export function getFirstDayOfMonth(date: string | Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 获取月份的最后一天
 * @param date 日期字符串或日期对象
 * @returns 月份的最后一天
 */
export function getLastDayOfMonth(date: string | Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * 获取日期范围内的所有日期
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期范围内的所有日期
 */
export function getDateRange(startDate: string | Date, endDate: string | Date): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const dates: string[] = []

  while (start <= end) {
    dates.push(formatDateShort(start))
    start.setDate(start.getDate() + 1)
  }

  return dates
}

/**
 * 计算两个日期之间的天数差
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 天数差
 */
export function getDaysDiff(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 添加天数
 * @param date 日期
 * @param days 天数
 * @returns 新日期
 */
export function addDays(date: string | Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * 添加月数
 * @param date 日期
 * @param months 月数
 * @returns 新日期
 */
export function addMonths(date: string | Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

/**
 * 添加年数
 * @param date 日期
 * @param years 年数
 * @returns 新日期
 */
export function addYears(date: string | Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

/**
 * 验证日期格式
 * @param dateString 日期字符串
 * @returns 是否为有效的日期格式
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}