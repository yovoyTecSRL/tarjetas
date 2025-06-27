#!/bin/bash

echo "🧹 Limpiando el repositorio Git actual..."
rm -rf .git

echo "🔧 Reinicializando el repositorio Git..."
git init
git checkout -b main
git remote add origin https://github.com/yovoyTecSRL/bcr-form.git

echo "📦 Agregando todos los archivos..."
git add .

echo "✅ Haciendo commit inicial..."
git commit -m '🧹 Reconfiguración limpia apuntando al repo bcr-form'

echo "🚀 Haciendo push forzado a GitHub (main)..."
git push -u origin main --force

echo "✅ Listo. Tu repo ahora está conectado correctamente a bcr-form 🔗"
