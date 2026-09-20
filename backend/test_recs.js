import fetch from 'node-fetch';

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
  });
  const { token } = await loginRes.json();
  if (!token) throw new Error('Login failed');

  console.log('Got token:', token.slice(0, 20) + '...');
  const res = await fetch('http://localhost:5000/api/chat/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}
test().catch(console.error);
