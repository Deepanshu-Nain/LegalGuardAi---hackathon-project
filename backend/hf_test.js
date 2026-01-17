// Test script to demonstrate the Hugging Face implementation
// This is equivalent to the Python code you provided

// Hugging Face Inference Client equivalent to Python code
class HuggingFaceInferenceClient {
  constructor(model, token, timeout = 120) {
    this.model = model;
    this.token = token;
    this.timeout = timeout;
  }

  async post(data) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout * 1000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }
}

// Setup equivalent to Python code
const HF_TOKEN = process.env.HF_TOKEN;
const repo_id = "ShivendraNT/ClauseGuard-BERT-Specialist";

const llm_client = new HuggingFaceInferenceClient(
  repo_id,
  HF_TOKEN,
  120
);

// Equivalent to Python call_llm function
async function call_llm(inference_client, prompt, task = "text-classification") {
  try {
    const response = await inference_client.post({
      inputs: prompt,
      parameters: { max_new_tokens: 200 },
      task: task,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling Hugging Face API:', error);
    throw error;
  }
}

// Test the implementation
async function testImplementation() {
  try {
    console.log('Testing Hugging Face implementation...');

    // Test with sample text (equivalent to your Python test)
    const testPrompt = "This is a legal contract about software licensing and intellectual property rights.";

    console.log('Input prompt:', testPrompt);

    const response = await call_llm(llm_client, testPrompt);
    console.log('Response:', JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('Test failed:', error.message);

    // Try fallback model
    console.log('Trying fallback model...');
    const fallback_client = new HuggingFaceInferenceClient(
      "cardiffnlp/twitter-roberta-base-sentiment-latest",
      HF_TOKEN,
      120
    );

    try {
      const fallbackResponse = await call_llm(fallback_client, testPrompt);
      console.log('Fallback response:', JSON.stringify(fallbackResponse, null, 2));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError.message);
    }
  }
}

// Uncomment to run the test
// testImplementation();

module.exports = { HuggingFaceInferenceClient, call_llm };