import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from transformers import pipeline

MODEL = os.environ.get("HF_MODEL_ID", "ShivendraNT/ClauseGuard-BERT-Specialist")

pipe = pipeline("text-classification", model=MODEL, device=-1)

print("Model loaded successfully")
print(pipe("This is a test text"))