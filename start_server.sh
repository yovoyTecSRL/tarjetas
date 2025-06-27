#!/bin/bash
cd /workspaces/bcr-form
echo "Iniciando servidor BCR en puerto 8001..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
