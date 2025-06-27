#!/usr/bin/env python3
import subprocess
import sys
import os

# Cambiar al directorio correcto
os.chdir('/workspaces/bcr-form')

# Iniciar el servidor
try:
    print("🚀 Iniciando servidor BCR en puerto 8001...")
    subprocess.run([
        sys.executable, "-m", "uvicorn", "main:app", 
        "--host", "0.0.0.0", "--port", "8001", "--reload"
    ])
except KeyboardInterrupt:
    print("\n⏹️ Servidor detenido")
except Exception as e:
    print(f"❌ Error: {e}")
