# FRONTEND
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\PROJECTS\colored; npm run dev'

# PYTHON BG-SERVICE
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\PROJECTS\colored\ai\background_remover; C:\PROJECTS\colored\.venv\Scripts\Activate.ps1; python main.py'

# SUPABASE LOCAL EDGE FUNCTION (NO JWT CHECK)
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\PROJECTS\colored; npx supabase functions serve process-item-image --no-verify-jwt --env-file supabase/functions/process-item-image/.env'

# DOCKER (BACKGROUND REMOVER / OTHER SERVICES)
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\PROJECTS\colored; docker compose up'
