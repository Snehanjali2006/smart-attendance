$nodeDir = "C:\Users\sneha\AppData\Local\OpenAI\Codex\runtimes\cua_node\ecfc0d9aa02807e3\bin"
$env:PATH = "$nodeDir;C:\Windows\system32;C:\Windows"
Set-Location "c:\Users\sneha\OneDrive\Desktop\attendance\idealab-smart-attendance\frontend"
& "$nodeDir\node.exe" "c:\Users\sneha\OneDrive\Desktop\attendance\idealab-smart-attendance\frontend\node_modules\vite\bin\vite.js" --host 0.0.0.0
