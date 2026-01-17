import requests
import mimetypes

# Test the document processing endpoint
url = 'http://127.0.0.1:3001/api/process-document'

# Check the mimetype of our test file
filename = 'test_document.pdf'
mimetype, encoding = mimetypes.guess_type(filename)
print(f"File: {filename}, Detected mimetype: {mimetype}")

# Test with the PDF file we created
files = {'document': open('test_document.pdf', 'rb')}

try:
    print("Sending PDF file to backend...")
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
finally:
    files['document'].close()