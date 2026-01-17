async function testEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/api/analyze-legal-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEndpoint();