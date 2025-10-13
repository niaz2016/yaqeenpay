# Ngrok Dual Tunnel Setup with Frontend Proxy

## 🚀 **Architecture Overview**

```
External Client
    ↓
http://e02e5acd7478.ngrok-free.app (Frontend Ngrok)
    ↓
Vite Dev Server (localhost:3000)
    ↓ /api/* requests proxied
https://localhost:7137 (Local HTTPS Backend)
```

## ✅ **Current Configuration**

### **Frontend (Vite Proxy)**
- **External URL**: `http://e02e5acd7478.ngrok-free.app`
- **Local URL**: `http://localhost:3000`
- **API Proxy**: `/api/*` → `https://localhost:7137`

### **Backend**
- **Local HTTPS**: `https://localhost:7137`
- **Accessible via**: Frontend proxy only (no direct ngrok)

### **Environment Settings**
```bash
VITE_API_URL=/api  # Uses relative URLs, proxied by Vite
```

## 🔧 **How It Works**

1. **External requests** hit your frontend ngrok URL
2. **Static assets** (HTML, CSS, JS) served by Vite dev server
3. **API calls** to `/api/*` are proxied to `https://localhost:7137`
4. **CORS handled** by Vite proxy with proper headers
5. **HTTPS certificates** bypassed with `secure: false`

## 🎯 **Benefits**

- ✅ **Single ngrok tunnel** needed for external access
- ✅ **Local HTTPS backend** accessible externally via proxy
- ✅ **No CORS issues** between frontend and backend
- ✅ **Simplified deployment** - one external URL
- ✅ **Development-friendly** - works locally and externally

## 📋 **Testing**

### **Local Testing**
```bash
# Frontend: http://localhost:3000
# Backend:  https://localhost:7137
# API calls: http://localhost:3000/api/* → https://localhost:7137/api/*
```

### **External Testing**
```bash
# Frontend: http://e02e5acd7478.ngrok-free.app
# Backend:  Proxied through frontend
# API calls: http://e02e5acd7478.ngrok-free.app/api/* → https://localhost:7137/api/*
```

## 🔍 **Verification Steps**

1. **Check backend is running**: `https://localhost:7137`
2. **Check frontend ngrok**: `http://e02e5acd7478.ngrok-free.app`
3. **Test API proxy**: Open browser dev tools and check network tab
4. **Login test**: Try logging in via both local and ngrok URLs

## 🛠 **Troubleshooting**

### **If API calls fail:**
- Ensure backend is running on `https://localhost:7137`
- Check Vite proxy logs in terminal
- Verify backend CORS allows requests from `localhost:3000`

### **If ngrok frontend fails:**
- Restart ngrok: `.\ngrok.exe http 3000`
- Update `allowedHosts` in vite.config.ts if URL changes

### **If HTTPS backend fails:**
- Check if backend certificate is valid
- Verify `secure: false` in proxy config
- Try direct backend access: `https://localhost:7137/api`

## 📝 **Commands Reference**

### **Start Frontend with Ngrok**
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start ngrok for frontend
.\ngrok.exe http 3000
```

### **Backend**
```bash
# Your .NET backend should be running on https://localhost:7137
```

The setup is now complete! Your frontend acts as a proxy that forwards API requests to your local HTTPS backend while being accessible externally via ngrok.