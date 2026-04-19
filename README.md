# Ved NoteHub – Microservices with Docker & Service Registry

A premium microservices-based Notes Application built with Flask, Docker, and a modern frontend.

## Architecture
- **API Gateway (Port 5000):** Central entry point. Communicates via Docker internal networking.
- **Auth Service (Port 5001):** Manages user security and JWT tokens.
- **Notes Service (Port 5002):** Manages user notes and persistence.
- **Service Registry (Port 5003):** Dynamic service discovery repository.
- **Frontend:** Premium UI using Vanilla HTML/CSS/JS.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## How to Run with Docker (Recommended)

One command to start everything:

```bash
docker-compose up --build
```

This will:
1. Build images for all 4 microservices.
2. Setup a private Docker network (`notes-network`).
3. Map the necessary ports to your localhost.
4. Launch all services in the correct order.

### Accessing the App
Once the containers are up, open **`frontend/login.html`** in your browser.

---

## How to Run Locally (Manual)

If you don't have Docker, you can still run services individually:

1. **Service Registry (Start first):** `python service-registry/app.py`
2. **Auth Service:** `python auth-service/app.py`
3. **Notes Service:** `python notes-service/app.py`
4. **API Gateway:** `python api-gateway/app.py`

*Note: When running locally, services default to `localhost` URLs.*

## Internal Networking (Docker)
Inside the Docker network, services communicate using these internal URLs:
- **Registry:** `http://service-registry:5003`
- **Auth:** `http://auth-service:5001`
- **Notes:** `http://notes-service:5002`

The API Gateway is configured via environment variables in `docker-compose.yml` to find the Registry at `http://service-registry:5003/services`.
"# cloud-project" 
