
# HIRENXT LMS / Job Hunt & Recruitment Platform

HIRENXT is a full-featured learning management, job hunting, and recruitment platform. This project provides a starter backend template designed to help you quickly deploy APIs for managing courses, job listings, applications, and recruitment workflows. The template includes a basic setup, deployment instructions, and environment configurations to get your backend running smoothly on an Amazon EC2 server.

## Features

- Basic Node.js/Express API setup

- Deployment-ready Dockerfile and configuration for easy containerization

- Environment variable management

- Instructions for deploying to EC2 instance

- Ready for CI/CD pipeline integration


## Prerequisites

- AWS Account with an EC2 instance running (Ubuntu recommended)

- SSH access configured for your EC2 instance

- Node.js and npm installed locally (for development)

- Docker installed on EC2 instance (optional, if using Docker deployment)
## Getting Started

- Clone the repository

    ```bash
    git clone https://github.com/asayushranjansinha/hirenxt.git
    cd hirenxt
    ```

- Setup Environment Variables

    Create a `.env` file at the root (if applicable) and configure variables like:

    ```env
    # Example environment variables
    NODE_ENV=development
    PORT=8080
    ```
## Run Locally

1. Install dependencies:

    ```bash
    npm install
    ```

2. Run the development server (with auto-reload):

    ```bash
    npm run dev
    ```

3. Or run the production server:

    ```bash
    npm run start
    ```
## Deployment to EC2

### Option A: Manual Deployment (without Docker)

1. SSH into your EC2 instance:

    ```bash
    ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip-address
    ```

2. Clone your repository on the EC2 instance:

    ```bash
    git clone https://github.com/asayushranjansinha/hirenxt.git
    cd hirenxt
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Set environment variables on the EC2 instance (e.g., using `.env` file or exporting variables):

    ```bash
    export PORT=8080
    # ...other variables
    ```

5. Start the server:

    ```bash
    npm run start
    ```

---

### Option B: Docker Deployment

1. SSH into your EC2 instance:

    ```bash
    ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip-address
    ```

2. Copy your project files or clone the repository on EC2:

    ```bash
    git clone https://github.com/asayushranjansinha/hirenxt.git
    cd hirenxt
    ```

3. Ensure your `.env` file is present on EC2 (upload or create it).

4. Build and start your containers using Docker Compose:

    ```bash
    docker-compose up -d --build
    ```

5. Your API will be accessible at:

    ```
    http://your-ec2-ip-address:8080/
    ```

---

**Note:** Make sure your EC2 security group allows inbound traffic on port **8080**.


## Using Nginx Reverse Proxy (optional)

In production, instead of exposing port 8080 publicly, you can configure Nginx on your EC2 instance to proxy requests from port 80 (standard HTTP port) to your API running on port 8080.

This setup allows your API to be accessed via:
  ```
  http://your-ec2-ip-address/api
  ```
instead of 
  ``` 
  http://your-ec2-ip-address:8080/
  ```

---

#### Example Nginx config snippet:

  ```nginx
  server {
    listen 80;

      server_name your-domain.com;  # or your-ec2-ip-address

      location /api/ {
          proxy_pass http://localhost:8080/api/;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }

      # Optionally serve other routes or return 404
      location / {
          return 404;
      }
  }
  ```
## License

[MIT](https://choosealicense.com/licenses/mit/)


## Authors

- [@asayushranjansinha](https://www.github.com/asayushranjansinha)

