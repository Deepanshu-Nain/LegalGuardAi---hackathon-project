const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const textract = require('textract');

const app = express();
const PORT = 3001;

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

// Hugging Face setup - equivalent to Python code
const HF_TOKEN = 'REMOVED';
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

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to extract text from different file types
const extractText = (buffer, mimeType) => {
  return new Promise((resolve, reject) => {
    if (mimeType === 'application/pdf') {
      pdfParse(buffer)
        .then(data => resolve(data.text))
        .catch(reject);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      mammoth.extractRawText({ buffer })
        .then(result => resolve(result.value))
        .catch(reject);
    } else if (mimeType === 'application/msword') {
      textract.fromBufferWithMime(mimeType, buffer, (error, text) => {
        if (error) reject(error);
        else resolve(text);
      });
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};

// Mock user database
const users = [
  { name: 'John Doe', email: 'user@example.com', password: 'password123' },
  { name: 'Admin User', email: 'admin@example.com', password: 'admin123' }
];

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ success: true, message: 'Login successful', user: { name: user.name, email: user.email } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Signup endpoint
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    res.status(400).json({ success: false, message: 'User already exists' });
  } else {
    const newUser = { name, email, password };
    users.push(newUser);
    res.json({ success: true, message: 'Signup successful', user: { name, email } });
  }
});

// Logout endpoint (for completeness)
app.post('/api/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// PDF and DOC processing endpoint
app.post('/api/process-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileType = req.file.mimetype;
    let text = '';

    // Extract text based on file type
    try {
      text = await extractText(req.file.buffer, fileType);
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Error extracting text from document. Please ensure the file is not corrupted and try again.' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'No text found in the document' });
    }

    // Truncate text if too long (BERT limit is 512 tokens, roughly 2000 characters)
    const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

    // Call Hugging Face API using the Python-style approach
    console.log('Calling Hugging Face API with text length:', truncatedText.length);
    console.log('Text preview:', truncatedText.substring(0, 100) + '...');
    
    // Use the call_llm function (equivalent to Python implementation)
    let result;
    try {
      result = await call_llm(llm_client, truncatedText, "text-classification");
      console.log('ClauseGuard model response:', result);
    } catch (error) {
      console.log('ClauseGuard model not available, trying fallback model...');
      
      // Fallback: create a new client for the sentiment model
      const fallback_client = new HuggingFaceInferenceClient(
        "cardiffnlp/twitter-roberta-base-sentiment-latest",
        HF_TOKEN,
        120
      );
      
      result = await call_llm(fallback_client, truncatedText, "text-classification");
      console.log('Fallback model response:', result);
      
      // Transform the sentiment result to indicate it's a fallback
      result = result.map(item => ({
        ...item,
        label: `General Analysis: ${item.label}`,
        isFallback: true
      }));
    }

    // The result is an array of predictions, take the top one
    const topPrediction = result[0];
    const isFallback = topPrediction.isFallback || false;

    // Map the label to human readable
    let humanReadableLabel;
    if (isFallback) {
      // Fallback model labels (sentiment analysis)
      const fallbackMapping = {
        'LABEL_0': 'Negative Sentiment',
        'LABEL_1': 'Neutral Sentiment', 
        'LABEL_2': 'Positive Sentiment'
      };
      humanReadableLabel = fallbackMapping[topPrediction.label] || topPrediction.label;
    } else {
      // Original legal classification labels
      const labelMapping = {
        'LABEL_0': 'Grant of Rights',
        'LABEL_1': 'Financial Terms',
        'LABEL_2': 'Protection IP',
        'LABEL_3': 'Dispute Resolution',
        'LABEL_4': 'Legal Foundation',
        'LABEL_5': 'Termination Exit',
        'LABEL_6': 'Operational Terms',
        'LABEL_7': 'Definitions',
        'LABEL_8': 'Liability Risk',
        'LABEL_9': 'General Boilerplate',
        'LABEL_10': 'Employee Specific',
        'LABEL_11': 'External Entities'
      };
      humanReadableLabel = labelMapping[topPrediction.label] || topPrediction.label;
    }

    res.json({
      success: true,
      message: 'Document processed successfully',
      classification: {
        label: humanReadableLabel,
        confidence: topPrediction.score,
        originalText: truncatedText,
        modelUsed: isFallback ? 'General Sentiment Analysis (fallback)' : 'ClauseGuard-BERT-Specialist'
      }
    });

  } catch (error) {
    console.error('Error processing document:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Error processing document';
    if (error.message.includes('401')) {
      errorMessage = 'Authentication failed. Please check the API key.';
    } else if (error.message.includes('403')) {
      errorMessage = 'Access forbidden. The model may not be available for inference.';
    } else if (error.message.includes('404')) {
      errorMessage = 'Model not found. Please check the model name.';
    } else if (error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    }
    
    res.status(500).json({ success: false, message: errorMessage, error: error.message });
  }
});

// Hugging Face Space proxy endpoint
app.post('/api/predict', async (req, res) => {
  try {
    const HF_SPACE_URL = "https://cyphernothere-jaskdhsjd.hf.space/predict";
    
    // Forward the request body to the Space
    const response = await fetch(HF_SPACE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_TOKEN}`  // Include token if the Space is private
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(120000)  // 2 minute timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (err) {
    console.error('Error forwarding to Hugging Face Space:', err?.message);
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { error: err.message };
    res.status(status).json(data);
  }
});

// Test endpoint with specific legal text
app.post('/api/analyze-legal-text', async (req, res) => {
  try {
    const url = "https://cyphernothere-jaskdhsjd.hf.space/predict";

    const payload = {
      text: "Licensee and its sublicensees shall use the Technology in the precise manner indicated in this Agreement and in any specifications that may be provided to Licensee by Licensor from time to time. Licensee and its sublicensees shall not make any material changes in the use or application of the Technology as set forth in such specifications without the prior written consent of Licensor, which consent shall not be unreasonably withheld so long as Licensor has been provided with all reasonably necessary information as to the basis for the requested change and has received reimbursement for the reasonable direct cost to Licensor of evaluating such requested change and submitted information."
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HF_TOKEN}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    res.json({ success: true, analysis: data });
  } catch (error) {
    console.error('Error analyzing legal text:', error);
    res.status(500).json({ success: false, message: 'Error analyzing legal text', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});