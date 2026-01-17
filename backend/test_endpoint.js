async function testCorrectEndpoint() {
  try {
    console.log('Testing the correct Gradio endpoint...');
    const response = await fetch('https://coolghost099-final.hf.space/gradio_api/call/analyze_clause', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: ["Licensee and its sublicensees shall use the Technology in the precise manner indicated in this Agreement."]
      })
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error);
  }
}

testCorrectEndpoint();