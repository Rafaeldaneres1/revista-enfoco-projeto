# Deploy

## Recomendacao

- `frontend`: Vercel
- `backend`: Render
- `banco`: MongoDB Atlas
- `uploads`: disco persistente do Render em `/var/data/uploads`

## Frontend no Vercel

1. Importe a pasta do projeto no Vercel.
2. Defina o diretorio raiz como `frontend`.
3. Framework preset: `Create React App`.
4. Build command: `npm run build`.
5. Output directory: `build`.
6. Variavel de ambiente:
   - `REACT_APP_BACKEND_URL=https://sua-api.onrender.com`

## Backend no Render

1. Crie um Web Service no Render.
2. Aponte para este repositorio.
3. Use o arquivo [render.yaml](C:\Users\daner\OneDrive\Documentos\New project\revista-enfoco-projeto\render.yaml) da raiz do projeto.
4. Confirme estas variaveis:
   - `MONGO_URL`
   - `DB_NAME`
   - `CORS_ORIGINS`
   - `SECRET_KEY`
   - `UPLOADS_DIR=/var/data/uploads`
5. Garanta que o disco persistente fique montado em `/var/data/uploads`.

## Banco no MongoDB Atlas

1. Crie um cluster no Atlas.
2. Crie um usuario do banco.
3. Libere o IP do Render, ou use acesso amplo enquanto estiver configurando.
4. Copie a connection string para `MONGO_URL`.

## Migrando o conteudo atual do Mongo local para o Atlas

Depois de criar o Atlas, rode este comando a partir da raiz do projeto:

```bash
C:\Users\daner\AppData\Local\Programs\Python\Python311\python.exe scripts/migrate_mongo.py ^
  --source-uri "mongodb://localhost:27017" ^
  --source-db "revista_enfoco" ^
  --target-uri "mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority&appName=revista-enfoco" ^
  --target-db "revista_enfoco" ^
  --drop-existing
```

Isso copia as colecoes do site atual, incluindo:
- noticias
- colunas
- colunistas
- eventos
- edicoes
- configuracoes da home
- equipe
- categorias
- usuarios do admin

## Ordem final para deixar online igual ao localhost

1. Subir o backend no Render com o `render.yaml`.
2. Criar o banco no MongoDB Atlas.
3. Rodar a migracao com `scripts/migrate_mongo.py`.
4. No Vercel, trocar `REACT_APP_BACKEND_URL` para a URL do Render.
5. Fazer novo deploy do frontend.

Sem essas 5 etapas, o site online pode abrir com a estrutura nova, mas continuar com conteudo antigo, incompleto ou em fallback.
