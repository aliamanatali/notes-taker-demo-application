# Galactic Archives Backend

FastAPI backend for the Star Wars Notes App ("Galactic Archives").

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set environment variables:

```bash
export MONGODB_URI="your-mongodb-atlas-connection-string"
export JWT_SECRET="your-secret-key"
```

3. Run the server:

```bash
python main.py
```

The server will start on `http://localhost:8000`

## API Endpoints

- `GET /healthz` - Health check with database connectivity
- `GET /api/v1` - API information

## Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string (required)
- `JWT_SECRET` - JWT signing secret (optional, defaults to development key)
- `PORT` - Server port (optional, defaults to 8000)
- `APP_ENV` - Environment (optional, defaults to "development")
- `CORS_ORIGINS` - Additional CORS origins (optional)

## Development

The server runs with auto-reload enabled in development mode.
