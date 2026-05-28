/**
 * Test Groq API Configuration
 * This script tests if your Groq API key is valid and working
 */

require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroqAPI() {
  console.log('='.repeat(60));
  console.log('Testing Groq API Configuration');
  console.log('='.repeat(60));

  const apiKey = process.env.GROQ_API_KEY;

  // Step 1: Check if API key is configured
  console.log('\n[Step 1] Checking API Key Configuration...');
  if (!apiKey) {
    console.error('❌ GROQ_API_KEY is NOT configured in .env file');
    process.exit(1);
  }

  console.log(`✓ API Key found`);
  console.log(`  - Length: ${apiKey.length} characters`);
  console.log(`  - Prefix: ${apiKey.substring(0, 10)}...`);
  console.log(`  - Valid format: ${apiKey.startsWith('gsk_') ? 'YES' : 'NO'}`);

  // Step 2: Initialize Groq client
  console.log('\n[Step 2] Initializing Groq Client...');
  let client;
  try {
    client = new Groq({ apiKey });
    console.log('✓ Groq client initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize Groq client:', err.message);
    process.exit(1);
  }

  // Step 3: Test API connection
  console.log('\n[Step 3] Testing API Connection with simple request...');
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Reply in Arabic.'
        },
        {
          role: 'user',
          content: 'مرحبا'
        }
      ],
      max_tokens: 50,
      temperature: 0.7
    });

    console.log('✓ API Connection successful!');
    console.log(`\nResponse received:`);
    console.log(`  Model: ${response.model}`);
    console.log(`  Message: ${response.choices[0].message.content}`);
    console.log(`  Stop reason: ${response.choices[0].finish_reason}`);

    console.log('\n' + '='.repeat(60));
    console.log('✓ All tests passed! Your Groq API is working correctly.');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\n❌ API Connection failed!');
    console.error('\nError Details:');
    console.error(`  - Status: ${err.status}`);
    console.error(`  - Code: ${err.code}`);
    console.error(`  - Message: ${err.message}`);

    if (err.status === 401) {
      console.error('\n⚠️  Authentication Error (401)');
      console.error('  This means your API key is invalid or expired.');
      console.error('  Solutions:');
      console.error('  1. Check if the API key is correct');
      console.error('  2. Regenerate the API key from https://console.groq.com/');
      console.error('  3. Copy the new key to your .env file');
    } else if (err.status === 429) {
      console.error('\n⚠️  Rate Limit Error (429)');
      console.error('  You have exceeded the rate limit.');
      console.error('  Wait a few minutes before trying again.');
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Network Error');
      console.error('  Cannot connect to Groq API.');
      console.error('  Check your internet connection.');
    }

    console.log('\n' + '='.repeat(60));
    process.exit(1);
  }
}

testGroqAPI();
