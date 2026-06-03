require('dotenv').config();
const ChatbotOrchestrator = require('../modules/chatbot/chatbot.orchestrator');

const queries = [
  'هل في عصير متاح ؟',
  'هل في عصير',
  'اعرض العصير المتاح',
];

(async () => {
  for (const q of queries) {
    const res = await ChatbotOrchestrator.handle(q, []);
    console.log('\nQ:', q);
    console.log('Type:', res.type);
    console.log('Message:', res.message || '(none)');
    console.log('Items:', res.items?.length || 0, res.items?.map((i) => i.name).join(', '));
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
