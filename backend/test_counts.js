const intHash = (seed) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return Math.abs(h);
};

const JAILS = ['CHY','CHG','SPWC','WGL','NZB','KNR','ADB','MBN','NLG','SGR','KMM'];

const countForRange = (fromISO, toISO) => {
    const start = new Date(fromISO); start.setHours(0,0,0,0);
    const end = new Date(toISO); end.setHours(0,0,0,0);
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
        const dd = String(cur.getDate()).padStart(2,'0');
        const mm = String(cur.getMonth()+1).padStart(2,'0');
        const dateStr = `${dd}/${mm}/${cur.getFullYear()}`;
        JAILS.forEach(code => {
            const h = intHash(`${code}${dateStr}`);
            if (h % 10 < 3) {
                count += (h % 5 === 0) ? 2 : 1;
            }
        });
        cur.setDate(cur.getDate()+1);
    }
    return count;
};

console.log('Today (16/07/2026):       ', countForRange('2026-07-16','2026-07-16'), 'records');
console.log('Yesterday (15/07):        ', countForRange('2026-07-15','2026-07-15'), 'records');
console.log('13/07 to 16/07 (4 days):  ', countForRange('2026-07-13','2026-07-16'), 'records');
console.log('Last 7 days:              ', countForRange('2026-07-09','2026-07-16'), 'records');
console.log('Last 30 days:             ', countForRange('2026-06-16','2026-07-16'), 'records');
