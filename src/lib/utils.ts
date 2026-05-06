
const moods = ['😞', '😕', '😐', '🙂', '😄'];

function nextRandomId(len: number): string {
  // https://github.com/ai/nanoid/blob/main/nanoid.js
  return crypto.getRandomValues(new Uint8Array(len)).reduce(
    (len, e) => len += (e &= 63) < 36 ? e.toString(36) : e < 62 ? (e - 26).toString(36).toUpperCase() : e > 62 ? "-" : "_", "")
}

function isPtInRect(rc: DOMRect, x: number, y: number) {
  return rc.x <= x && x < rc.x + rc.width && rc.y <= y && y < rc.y + rc.height;
}

const initResizeObserver = (ref: HTMLElement, handler: any) => {
  const resizeObserver = new ResizeObserver(entries => {
    let sizes = [];
    for (let entry of entries) {
      let size;
      if (entry.contentBoxSize) {
        size = (Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize).inlineSize;
      } else {
        size = entry.contentRect.width;
      }
      sizes.push(size);
    }
    handler(sizes);
  });
  resizeObserver.observe(ref);
  return resizeObserver;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    .toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDateYYYYMMDD(dateStr: string): string {
  return dateStr.split('T')[0];
}


export {
  nextRandomId,
  isPtInRect,
  initResizeObserver,
  moods,
  formatDate,
  formatTime,
  formatDateYYYYMMDD
}