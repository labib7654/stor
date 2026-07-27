// بصمة الزائر - معرف ثابت يُخزّن بجهاز الزائر عشان نعرف رجوعه بدون أي تسجيل دخول
// ما نجمع ولا نخزن أي بيانات شخصية - بس معرف عشوائي + معلومات تقنية عامة (نوع الجهاز، اللغة، ...)

const VISITOR_KEY = 'storefront_visitor_id';

function generateVisitorId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = generateVisitorId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

const VISITOR_ID = getVisitorId();
let CURRENT_VISIT_ID = null;
const VISIT_STARTED_AT = Date.now();

async function trackVisit() {
  try {
    const res = await fetch(`${API_BASE}/api/public/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: VISITOR_ID,
        entryPage: window.location.pathname,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenRes: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const data = await res.json();
    CURRENT_VISIT_ID = data.visitId;
  } catch (_) {
    // تتبع الزيارة ثانوي - لو فشل ما نكسر تجربة المستخدم
  }
}

function endVisitBeacon() {
  if (!CURRENT_VISIT_ID) return;
  const durationSeconds = Math.round((Date.now() - VISIT_STARTED_AT) / 1000);
  const payload = JSON.stringify({ visitId: CURRENT_VISIT_ID, durationSeconds });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(`${API_BASE}/api/public/visit/end`, new Blob([payload], { type: 'application/json' }));
  }
}

window.addEventListener('pagehide', endVisitBeacon);
trackVisit();
