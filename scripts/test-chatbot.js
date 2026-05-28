/**
 * Test Chatbot API Endpoint
 * Tests the complete chatbot flow with the Groq API
 */

const http = require('http');

function testChatbot(message) {
  return new Promise((resolve, reject) => {
    // Properly encode JSON with UTF-8 support
    const data = Buffer.from(JSON.stringify({ message }), 'utf8');

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/chatbot',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': data.length
      }
    };

    console.log('\n' + '='.repeat(60));
    console.log('Testing Chatbot API');
    console.log('='.repeat(60));
    console.log(`\nSending message: "${message}"`);
    console.log('Waiting for response...\n');

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          
          console.log('Response Status:', res.statusCode);
          console.log('Response Body:', JSON.stringify(result, null, 2));

          if (result.success) {
            console.log('\n✓ Chatbot responded successfully!');
            console.log(`\n📝 Bot says:\n${result.message}`);
          } else {
            console.log('\n❌ Chatbot returned an error:');
            console.log(result.message);
          }

          console.log('\n' + '='.repeat(60));
          resolve(result);
        } catch (err) {
          console.error('Failed to parse response:', err.message);
          console.error('Raw response:', responseData.substring(0, 200));
          reject(err);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    // Test 1: Simple greeting
    await testChatbot('السلام عليكم');
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Ask for cheapest products
    await testChatbot('ما أرخص منتجات لديكم؟');

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTests();
