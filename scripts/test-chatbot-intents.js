/**
 * اختبار سريع لتصنيف نوايا الشات بوت
 * node scripts/test-chatbot-intents.js
 */

const ChatbotIntent = require('../modules/chatbot/chatbot.intent');

const cases = [
  { q: 'اي ارخص اكل متاح', expect: 'PRICE' },
  { q: 'إيه أرخص أكل عندكم؟', expect: 'PRICE' },
  { q: 'هل في عصير متاح', expect: 'FILTER' },
  { q: 'هل في عصير؟', expect: 'FILTER' },
  { q: 'في بيتزا', expect: 'FILTER' },
  { q: 'هل البيتزا مناسبة لمرضى السكر', expect: 'ADVISORY' },
  { q: 'هل البيتزا مناسب لمرضى السكر؟', expect: 'ADVISORY' },
  { q: 'هات قائمة الطعام', expect: 'LIST' },
  { q: 'اعرض المنيو', expect: 'LIST' },
  { q: 'في إيه عندكم', expect: 'LIST' },
  { q: 'هات العصاير', expect: 'FILTER' },
  { q: 'قارن بين برجر وبيتزا', expect: 'COMPARE' },
  { q: 'هل العصير مضر للناس اللي عامله دايت؟', expect: 'ADVISORY' },
];

let failed = 0;
cases.forEach(({ q, expect }) => {
  const got = ChatbotIntent.classify(q);
  const ok = got === expect;
  if (!ok) failed += 1;
  console.log(`${ok ? '✓' : '✗'} "${q}" → ${got} (expected ${expect})`);
});

process.exit(failed > 0 ? 1 : 0);
