const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../views/cashier/dashboard.ejs');
const out = '/tmp/dashboard_render.html';

const data = {
  user: { name: 'Test User' }
};

ejs.renderFile(file, data, {}, (err, str) => {
  if (err) {
    console.error('Render error:', err);
    process.exit(1);
  }
  fs.writeFileSync(out, str, 'utf8');
  console.log('Rendered to', out);
});
