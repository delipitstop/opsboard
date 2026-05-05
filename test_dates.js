const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(y, m, d) {
  return String(d).padStart(2, '0') + ' ' + MONTHS[m - 1]
}

function getWeekStart(y, m, d) {
  const dow = new Date(y, m - 1, d).getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const monday = new Date(y, m - 1, d + diff)
  return [monday.getFullYear(), monday.getMonth() + 1, monday.getDate()]
}

function addWeeks(y, m, d, n) {
  const r = new Date(y, m - 1, d + n * 7)
  return [r.getFullYear(), r.getMonth() + 1, r.getDate()]
}

function fmtWeek(y, m, d) {
  return fmt(y, m, d) + ' - ' + fmt(...addWeeks(y, m, d, 0))
}

function fmtDisplayDate(y, m, d) {
  return fmt(y, m, d)
}

// Test cases
console.log('=== getWeekStart ===')
console.log('May 4:', fmtWeek(...getWeekStart(2026, 5, 4)))
console.log('May 5:', fmtWeek(...getWeekStart(2026, 5, 5)))
console.log('May 3:', fmtWeek(...getWeekStart(2026, 5, 3)))
console.log('May 6:', fmtWeek(...getWeekStart(2026, 5, 6)))

console.log('\n=== Navigation ===')
console.log('Prev week from May4 (27 Apr):', fmtWeek(...addWeeks(...getWeekStart(2026, 5, 4), -1)))
console.log('Next week from May4 (4 May):', fmtWeek(...addWeeks(...getWeekStart(2026, 5, 4), 1)))

console.log('\n=== Display Dates ===')
console.log('Display May 4:', fmtDisplayDate(2026, 5, 4))
console.log('Display May 5:', fmtDisplayDate(2026, 5, 5))
console.log('Display May 3:', fmtDisplayDate(2026, 5, 3))

console.log('\n=== End of week calculation ===')
function fmtEnd(y, m, d) {
  const r = new Date(y, m - 1, d + 6)
  return fmt(r.getFullYear(), r.getMonth() + 1, r.getDate())
}
console.log('Week ending for May4:', fmtEnd(...getWeekStart(2026, 5, 4)))
console.log('Week ending for May5:', fmtEnd(...getWeekStart(2026, 5, 5)))
console.log('Week ending for May3:', fmtEnd(...getWeekStart(2026, 5, 3)))