// تتبع الزوار (البصمة الرقمية) - كل استعلامات جدول visitors و visits هنا فقط

const supabase = require('../config/supabase');
const VISITORS = 'visitors';
const VISITS = 'visits';

// يسجل زيارة جديدة لزائر (موجود أو جديد) ويرجع رقم الزيارة عشان نقفلها لاحقًا بمدتها
async function trackVisit({ visitorId, entryPage, referrer, userAgent, language, screenRes, timezone }) {
  const { data: existing } = await supabase.from(VISITORS).select('*').eq('id', visitorId).maybeSingle();

  if (existing) {
    await supabase
      .from(VISITORS)
      .update({
        last_seen: new Date().toISOString(),
        visits_count: (existing.visits_count || 0) + 1,
        last_entry_page: entryPage,
        last_referrer: referrer,
        user_agent: userAgent,
        language,
        screen_res: screenRes,
        timezone,
      })
      .eq('id', visitorId);
  } else {
    await supabase.from(VISITORS).insert({
      id: visitorId,
      last_entry_page: entryPage,
      last_referrer: referrer,
      user_agent: userAgent,
      language,
      screen_res: screenRes,
      timezone,
    });
  }

  const { data: visit, error } = await supabase
    .from(VISITS)
    .insert({ visitor_id: visitorId, entry_page: entryPage, referrer })
    .select()
    .single();
  if (error) throw error;
  return visit;
}

// يقفل الزيارة بمدتها الفعلية (تُرسل عند مغادرة الصفحة) ويضيفها لإجمالي وقت الزائر
async function endVisit(visitId, durationSeconds) {
  const { data: visit } = await supabase.from(VISITS).select('visitor_id').eq('id', visitId).maybeSingle();
  if (!visit) return;

  await supabase
    .from(VISITS)
    .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq('id', visitId);

  const { data: visitor } = await supabase
    .from(VISITORS)
    .select('total_duration_seconds')
    .eq('id', visit.visitor_id)
    .maybeSingle();

  if (visitor) {
    await supabase
      .from(VISITORS)
      .update({ total_duration_seconds: (visitor.total_duration_seconds || 0) + durationSeconds })
      .eq('id', visit.visitor_id);
  }
}

async function listVisitors({ page = 1, pageSize = 25 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from(VISITORS)
    .select('*', { count: 'exact' })
    .order('last_seen', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data, count };
}

module.exports = { trackVisit, endVisit, listVisitors };
