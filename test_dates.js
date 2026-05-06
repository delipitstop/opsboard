const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(y, m, d) {
  return String(d).padStart(2, '0') + ' ' + MONTHS[m - 1]
}

function parseYMD(ws) {
  const [y, m, d] = ws.split('-').map(Number)
  return [y, m, d]
}

function getWeekStart(ws) {
  const [y, m, d] = parseYMD(ws)
  const dow = new Date(y, m - 1, d).getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const monday = new Date(y, m - 1, d + diff)
  return String(monday.getFullYear()) + '-' +
    String(monday.getMonth() + 1).padStart(2, '0') + '-' +
    String(monday.getDate()).padStart(2, '0')
}

function addWeeks(ws, n) {
  const [y, m, d] = parseYMD(ws)
  const result = new Date(y, m - 1, d + n * 7)
  return String(result.getFullYear()) + '-' +
    String(result.getMonth() + 1).padStart(2, '0') + '-' +
    String(result.getDate()).padStart(2, '0')
}

function fmtWeekRange(ws) {
  const [y, m, d] = parseYMD(ws)
  return {
    start: fmt(y, m, d),
    end: fmt(y, m, d + 6),
  }
}

// Test every relevant date
const testDates = ['2026-05-04', '2026-05-05', '2026-05-03', '2026-05-06',
                   '2026-04-27', '2026-04-26', '2026-04-25', '2026-04-28']

console.log('=== getWeekStart for all dates ===')
for (const td of testDates) {
  const ws = getWeekStart(td)
  const range = fmtWeekRange(ws)
  const [y, m, day] = parseYMD(td)
  const realDow = new Date(y, m - 1, day).getDay()
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  console.log(`${td} (${dayNames[realDow]}): week starts ${ws} = ${range.start} - ${range.end}`)
}

console.log('\n=== Navigation from May 4 ===')
let ws = '2026-05-04'
console.log('Start:', fmtWeekRange(ws).start, '-', fmtWeekRange(ws).end)
for (let i = -3; i <= 3; i++) {
  console.log(`addWeeks(${i}):`, fmtWeekRange(addWeeks(ws, i)).start, '-', fmtWeekRange(addWeeks(ws, i)).end)
}

console.log('\n=== Check end of week display (d+6) ===')
const [y, m, d] = parseYMD('2026-05-04')
console.log('d+6 for May 4:', d + 6, '=', fmt(y, m, d + 6))
const [y2, m2, d2] = parseYMD('2026-04-27')
console.log('d+6 for Apr 27:', d2 + 6, '=', fmt(y2, m2, d2 + 6))