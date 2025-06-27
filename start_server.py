#!/usr/bin/env python3
import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Iniciando servidor BCR Form en puerto 8001...")
    print("📍 URL: http://localhost:8001")
    print("🔧 Modo de desarrollo activo")
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
