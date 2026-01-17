import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["USE_TF"] = "0"

from transformers import pipeline
import gradio as gr

MODEL = os.environ.get("HF_MODEL_ID", "ShivendraNT/ClauseGuard-BERT-Specialist")  # Set HF_MODEL_ID in Space settings if needed

# Load the pipeline (assuming text-classification; adjust task if different)
pipe = pipeline("text-classification", model=MODEL, device=-1)  # Use device=0 for GPU

def classify_file(file):
    if file is None:
        return {"error": "No file uploaded"}
    try:
        with open(file.name, 'r', encoding='utf-8') as f:
            text = f.read()
        result = pipe(text)
        return result
    except Exception as e:
        return {"error": str(e)}

# Gradio interface with file upload
iface = gr.Interface(
    fn=classify_file,
    inputs=gr.File(label="Upload Text File (.txt)", file_types=[".txt"]),
    outputs=gr.JSON(label="Classification Result"),
    title="ClauseGuard BERT Specialist",
    description="Upload a text file to classify it using the ClauseGuard BERT model."
)

if __name__ == "__main__":
    iface.launch()