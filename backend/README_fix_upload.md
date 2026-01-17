Why this change?

The frontend reported repeated 400 errors when calling `/api/process-document`.

What I changed

- Added request logging for `Content-Type` on `/api/process-document` to detect malformed multipart form requests.
- Added a global error handler that surfaces `Unexpected end of form` and `LIMIT_FILE_SIZE` as clear 400 responses instead of generic 500s.

How to test (browser)

1. Start backend (already running):

```powershell
cd "c:\Users\ALG\Desktop\web dev\backend"
node server.js
```

2. Start the frontend dev server (Vite) in your workspace root where `package.json` for the frontend exists.

```powershell
# from workspace root where frontend package.json is
npm run dev
```

3. In the app UI, upload a small PDF (`test_document.pdf`) and watch backend logs for the Content-Type and any warnings.

How to test (curl on Windows PowerShell)

PowerShell's bundled `curl` maps to `Invoke-WebRequest` which has different args. Use this to POST a file instead:

```powershell
$boundary = [System.Guid]::NewGuid().ToString()
$lf = "`r`n"
$bytes = Get-Content -Raw -Encoding Byte -Path .\test_document.pdf
$header = "--$boundary$lfContent-Disposition: form-data; name=\"document\"; filename=\"test_document.pdf\"$lfContent-Type: application/pdf$lf$lf"
$trailer = "$lf--$boundary--$lf"
$body = ([System.Text.Encoding]::UTF8.GetBytes($header)) + $bytes + ([System.Text.Encoding]::UTF8.GetBytes($trailer))

Invoke-WebRequest -Uri http://localhost:3001/api/process-document -Method Post -Body $body -ContentType "multipart/form-data; boundary=$boundary"
```

Notes

- If you still get `Malformed multipart/form-data` in the response, the upload is getting interrupted (firewall, proxy) or the client isn't sending a proper multipart boundary header.
- The browser `fetch` approach from `ResponsiveAIAssistant.tsx` is valid; if errors persist, check browser devtools network tab and the new backend logs for the Content-Type value.
