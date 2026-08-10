$nodeDir = "C:\Users\sneha\AppData\Local\OpenAI\Codex\runtimes\cua_node\ecfc0d9aa02807e3\bin"
$env:PATH = "$nodeDir;C:\Windows\system32;C:\Windows"
Set-Location "c:\Users\sneha\OneDrive\Desktop\attendance\idealab-smart-attendance\frontend"
& "$nodeDir\node.exe" "$nodeDir\node_modules\npm\bin\npm-cli.js" install vite @vitejs/plugin-react --save
