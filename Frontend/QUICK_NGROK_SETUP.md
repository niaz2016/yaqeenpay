# Quick Ngrok Setup Commands

## Step 1: Get Your Auth Token
1. Go to https://ngrok.com/
2. Sign up for a free account (if you don't have one)
3. Go to https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your auth token

## Step 2: Authenticate Ngrok
Run this command with your actual auth token:
```powershell
.\ngrok.exe config add-authtoken YOUR_AUTH_TOKEN_HERE
```

## Step 3: Start Your Servers

### Frontend Server (Terminal 1)
```powershell
# Make sure you're in the Frontend directory
cd "D:\Work Repos\AI\yaqeenpay\Frontend"
npm run dev
# Should start on http://localhost:3000
```

### Backend Server (Terminal 2)
Make sure your .NET backend is running on https://localhost:7137

## Step 4: Expose Ports via Ngrok

### For Frontend (Terminal 3)
```powershell
cd "D:\Work Repos\AI\yaqeenpay\Frontend"
.\ngrok.exe http 3000
```

### For Backend (Terminal 4) - Run this in a separate terminal
```powershell
cd "D:\Work Repos\AI\yaqeenpay\Frontend"
.\ngrok.exe http https://localhost:7137
```

## Important Notes
- Free ngrok accounts can only run **one tunnel at a time**
- You'll need to run frontend and backend ngrok in sequence, or upgrade to a paid plan
- The URLs will change each time you restart ngrok

## Alternative: Use One Tunnel at a Time
Since free accounts are limited to one tunnel:

### Option A: Expose Frontend Only
```powershell
.\ngrok.exe http 3000
# Access via: https://xxxxx.ngrok.io
# Backend calls will use localhost:7137 (local backend)
```

### Option B: Expose Backend Only  
```powershell
.\ngrok.exe http https://localhost:7137
# Update frontend .env to use: https://xxxxx.ngrok.io/api
# Frontend accessed via localhost:3000
```

### Option C: Expose Frontend with Backend Proxy
Update your frontend vite config to proxy backend calls, then expose only frontend.