# start.ps1
$port = 3001

# Trouve et tue les processus utilisant le port
$pid = (netstat -ano | findstr :$port)[0] -split '\s+' | Select-Object -Last 1
if ($pid) { Stop-Process -Id $pid -Force }

# Démarre le serveur
node .\server.js