const express = require('express');
const cors = require('cors');
const multer = require('multer');
// const pdfParse = require('pdf-parse');
// const mammoth = require('mammoth');
// const textract = require('textract');

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const { Client } = require("@gradio/client");

const app = express();
const PORT = 3004;

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

// Summarization model
const summary_client = new HuggingFaceInferenceClient(
  "facebook/bart-large-cnn",
  HF_TOKEN,
  120
);

const API_KEY = "Nx3n9OzQCfTsXcstwiSFVsGStmH6Lvow";
const BASE_URL = "https://api.on-demand.io/chat/v1";
const EXTERNAL_USER_ID = uuidv4();
const AGENTS = {
    RESEARCHER: {
        id: ["agent-1741871229"],
        prompt: "Identify real-world legal disputes or case laws that match this clause pattern. Focus on IP leasing and R&D. Return strictly JSON: { 'matched_cases': [...] }"
    },
    FAULT_FINDER: {
        id: ["agent-1739384980"],
        prompt: "Analyze the clause and the provided case research. Identify maximum loopholes and exploitation paths. Return strictly JSON: { 'loopholes': [], 'exploitation_paths': [] }"
    },
    PROOF_READER: {
        id: ["agent-1726226353"],
        prompt: "Determine if the clause and the identified exploitation strategies are legally valid under Indian law. Flag unconscionable parts. Return JSON: { 'clause_legality': '', 'exploitation_legality': [] }"
    },
    DRAFTER: {
        id: ["agent-1712327325"],
        prompt: "Rewrite the clause to eliminate all identified loopholes and legal risks while preserving commercial intent. Return JSON: { 'revised_clause': '', 'summary_of_changes': '' }"
    }
};

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

// Function to get summary
async function get_summary(text) {
  try {
    const result = await call_llm(summary_client, text, "summarization");
    return result[0]?.summary_text || "Summary not available";
  } catch (error) {
    console.error('Error getting summary:', error);
    return "Summary not available";
  }
}

async function callAgent(sessionId, query, agentConfig) {
    const url = `${BASE_URL}/sessions/${sessionId}/query`;
    const body = {
        endpointId: "predefined-xai-grok4.1-fast",
        query: query,
        agentIds: agentConfig.id,
        responseMode: "sync",
        reasoningMode: "grok-4-fast",
        modelConfigs: {
            fulfillmentPrompt: agentConfig.prompt,
            temperature: 0.2,
        },
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const result = await response.json();
    return result.data.answer;
}

async function runLegalWorkflow(clause) {
    console.log("🚀 Starting Legal Analysis Workflow...");
    const sessionResponse = await fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: AGENTS.RESEARCHER.id, externalUserId: EXTERNAL_USER_ID })
    });
    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.data.id;
    console.log(`✅ Session Created: ${sessionId}`);
    try {
        const researchData = await callAgent(sessionId, `Original Clause: ${clause}`, AGENTS.RESEARCHER);
        console.log("Found Research Data.");
        const loopholeQuery = `Clause: ${clause}\nResearch Context: ${researchData}`;
        const loopholeData = await callAgent(sessionId, loopholeQuery, AGENTS.FAULT_FINDER);
        console.log("Loopholes Identified.");
        const validationQuery = `Clause: ${clause}\nLoopholes: ${loopholeData}`;
        const validationData = await callAgent(sessionId, validationQuery, AGENTS.PROOF_READER);
        console.log("Legal Validation Complete.");
        const draftQuery = `Original: ${clause}\nLoopholes: ${loopholeData}\nValidation: ${validationData}`;
        const finalClause = await callAgent(sessionId, draftQuery, AGENTS.DRAFTER);
        console.log("\n--- FINAL WORKFLOW OUTPUT ---");
        console.log(finalClause);
        return finalClause;
    } catch (error) {
        console.error("❌ Workflow Error:", error);
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
    } else if (mimeType === 'text/plain') {
      // Accept plain text uploads (useful for quick testing)
      try {
        resolve(buffer.toString('utf8'));
      } catch (e) {
        reject(e);
      }
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};

// Helper: Chunk text to respect BERT's 512 token limit
function chunkText(text, chunkSize = 500) {
    // Simple splitting by sentences/periods to keep context
    const sentences = text.match(/[^.!?]+[.!?]+[\])'"]?/g) || [text];
    let chunks = [];
    let currentChunk = "";

    sentences.forEach(sentence => {
        if ((currentChunk + sentence).length > chunkSize) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += " " + sentence;
        }
    });
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

// Robust caller for a Hugging Face Gradio Space using @gradio/client
async function call_hf_space(text) {
  const HF_SPACE_ID = "Coolghost099/final";
  try {
    console.log('Calling Hugging Face Space for text (truncated):', text.slice(0, 120));

    // NEW: Using @gradio/client
    try {
      const client = await Client.connect(HF_SPACE_ID);
      const result = await client.predict("/predict", { text: text });
      console.log('Gradio result:', result);
      return result.data;
    } catch (gradioErr) {
      console.warn('Gradio client failed, falling back to manual fetch:', gradioErr.message);
    }

    // OLD: Manual fetch fallback
    // initial POST to space
    let initialResponse;
    try {
      initialResponse = await fetch(`https://huggingface.co/spaces/${HF_SPACE_ID}/gradio_api/call/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HF_TOKEN}`
        },
        body: JSON.stringify({ data: [text] }),
        signal: AbortSignal.timeout(10000)
      });
    } catch (fetchErr) {
      console.warn('call_hf_space initial fetch failed or timed out:', fetchErr && fetchErr.message);
      return null; // network unreachable or blocked — return null so caller can fallback
    }

    const bodyText = await initialResponse.text();
    let parsed = null;
    try { parsed = JSON.parse(bodyText); } catch (err) { /* not JSON */ }

    // If space returned an event_id, poll for result
    if (parsed && parsed.event_id) {
      const eventId = parsed.event_id;
      const pollUrl = `https://huggingface.co/spaces/${HF_SPACE_ID}/gradio_api/call/predict/${eventId}`;
      const start = Date.now();
      while (Date.now() - start < 15000) {
        try {
          const pollResp = await fetch(pollUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${HF_TOKEN}` },
            signal: AbortSignal.timeout(5000)
          });
          const pollText = await pollResp.text();
          try {
            const pollJson = JSON.parse(pollText);
            if (pollJson && pollJson.data) return pollJson.data[0];
          } catch (e) {
            if (pollText.includes('data: ')) {
              const dataLine = pollText.split('\n').find(l => l.startsWith('data: '));
              if (dataLine) {
                const dataStr = dataLine.replace('data: ', '');
                try { return JSON.parse(dataStr); } catch (pe) { /* ignore */ }
              }
            }
          }
        } catch (pollErr) {
          console.warn('call_hf_space poll fetch failed:', pollErr && pollErr.message);
          break;
        }
        await new Promise(r => setTimeout(r, 500));
      }
      return null;
    }

    if (parsed && parsed.data) return parsed.data[0];
    if (bodyText && bodyText.includes('data: ')) {
      const dataLine = bodyText.split('\n').find(l => l.startsWith('data: '));
      if (dataLine) {
        const dataStr = dataLine.replace('data: ', '');
        try { return JSON.parse(dataStr); } catch (e) { /* ignore */ }
      }
    }

    return parsed || bodyText;
  } catch (err) {
    console.error('call_hf_space error:', err && err.message);
    return null;
  }
}

// Normalize various Gradio/HF Space response shapes into [{label, score}] format
function normalizeGradioResult(res) {
  if (!res) return null;

  // If it's an object with prediction array
  if (res.prediction && Array.isArray(res.prediction)) {
    return res.prediction;
  }

  // If it's a string (raw), return as single label
  if (typeof res === 'string') return [{ label: res, score: 1 }];

  // If it's already an array of objects with label
  if (Array.isArray(res)) {
    // Case: [["label", ...]] nested arrays
    if (Array.isArray(res[0])) {
      // Flatten if inner arrays contain strings
      if (typeof res[0][0] === 'string') {
        return res.map(inner => ({ label: inner[0], score: inner[1] || 1 }));
      }
    }

    // Case: [{ label: 'X', score: 0.9 }, ...]
    if (typeof res[0] === 'object' && res[0] !== null && ('label' in res[0] || 'score' in res[0])) {
      return res.map(item => ({ label: item.label || item[0] || 'Unknown', score: item.score || item[1] || 0 }));
    }

    // Case: ['label1', 'label2']
    if (typeof res[0] === 'string') {
      return res.map(lbl => ({ label: lbl, score: 1 }));
    }
  }

  // Fallback: return null so caller can decide
  return null;
}

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
    // Debugging: log content-type to detect malformed multipart requests
    console.log('--- /api/process-document incoming ---');
    console.log('Content-Type header:', req.headers['content-type']);

    if (!req.file) {
      console.warn('No file attached to request (req.file is undefined)');
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

    // 2. CHUNKING LAYER
    const textChunks = chunkText(text);

    // 3. INFERENCE LAYER (Process chunks in parallel)
    const analysisResults = await Promise.all(
      textChunks.map(async (chunk) => {
        try {
          // First try direct model inference via Inference API
          let result = await call_llm(llm_client, chunk, "text-classification");
          console.log('ClauseGuard model response for chunk:', result);

          // Normalize if possible
          let normalized = null;
          try {
            if (Array.isArray(result)) {
              // try to map HF inference array -> {label, score}
              normalized = result.map(r => ({ label: r.label || r[0] || 'Unknown', score: r.score || r[1] || (r?.score ?? 0) }));
            }
          } catch (e) { /* continue to fallback */ }

          // If direct inference gave nothing usable, try Gradio Space
          if (!normalized || normalized.length === 0) {
            console.log('Direct inference empty — trying Hugging Face Space fallback for chunk');
            try {
              const spaceRes = await call_hf_space(chunk);
              const norm = normalizeGradioResult(spaceRes);
              if (norm && norm.length) {
                normalized = norm;
                console.log('Gradio Space returned normalized result for chunk:', normalized);
              }
            } catch (spaceErr) {
              console.warn('Hugging Face Space fallback failed for chunk:', spaceErr && spaceErr.message);
            }
          }

          // If still empty, try sentiment fallback model to at least get something
          if (!normalized || normalized.length === 0) {
            console.log('Trying sentiment fallback model for chunk...');
            try {
              const fallback_client = new HuggingFaceInferenceClient(
                "cardiffnlp/twitter-roberta-base-sentiment-latest",
                HF_TOKEN,
                120
              );
              const fb = await call_llm(fallback_client, chunk, "text-classification");
              if (Array.isArray(fb)) {
                normalized = fb.map(item => ({ label: `General Analysis: ${item.label || item[0] || 'Unknown'}`, score: item.score || item[1] || 0, isFallback: true }));
              }
            } catch (fbErr) {
              console.warn('Sentiment fallback failed:', fbErr && fbErr.message);
            }
          }

          return { text: chunk, prediction: normalized || null };
        } catch (err) {
          console.error("HF API Error for chunk:", err);
          return { text: chunk, prediction: null, error: true };
        }
      })
    );

    res.json({
      success: true,
      message: 'Document processed successfully',
      data: analysisResults
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
    console.log('--- /api/predict incoming ---');
    console.log('Headers:', req.headers);
    console.log('Body (parsed):', req.body);

    const text = req.body.text || req.query.text || '';
    if (!text) return res.status(400).json({ success: false, message: 'No text provided' });

    // Get analysis from Hugging Face Space
    const spaceResult = await call_hf_space(text);
    const normalized = normalizeGradioResult(spaceResult);

    let analysisText = '';
    if (normalized && normalized.length > 0) {
      const prediction = normalized[0];
      analysisText = `Analysis: This input appears to be classified as **${prediction.label}** with ${(prediction.score * 100).toFixed(2)}% confidence.`;
    } else {
      analysisText = 'Analysis: Unable to classify this input.';
    }

    // Get summary
    const summary = await get_summary(text);
    const summaryText = `Summary: ${summary}`;

    // Combine analysis and summary
    const responseText = `${analysisText}\n\n${summaryText}`;

    return res.json({ success: true, response: responseText });
  } catch (err) {
    console.error('Error forwarding to Hugging Face Space:', err && err.message);
    res.status(500).json({ success: false, message: 'Error processing request', error: err && err.message });
  }
});

app.post('/api/legal-analysis', async (req, res) => {
    try {
        const clause = req.body.clause;
        if (!clause) {
            return res.status(400).json({ success: false, message: 'No clause provided' });
        }
        const result = await runLegalWorkflow(clause);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error in legal analysis:', error);
        res.status(500).json({ success: false, message: 'Error processing legal analysis', error: error.message });
    }
});

console.log('PORT is', PORT);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:3005`);
});

// Multer / busboy error handler - surface malformed form errors clearly
// app.use((err, req, res, next) => {
//   if (!err) return next();
//   console.error('Unhandled error in middleware:', err && err.message);
//   // Common multipart issue
//   if (err.message && err.message.includes('Unexpected end of form')) {
//     return res.status(400).json({ success: false, message: 'Malformed multipart/form-data. Upload interrupted or boundary missing.' });
//   }
//   if (err.code === 'LIMIT_FILE_SIZE') {
//     return res.status(400).json({ success: false, message: 'Uploaded file is too large.' });
//   }
//   // Fallback to default error
//   res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
// });