FROM node:18-alpine

# Configurar o diretório de trabalho
WORKDIR /app

# Copiar os arquivos do projeto
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Rodar o servidor
CMD ["npm", "run", "serve"]
