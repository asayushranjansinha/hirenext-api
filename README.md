
# HIRENXT LMS / Job Hunt & Recruitment Platform

HIRENXT is a full-featured learning management, job hunting, and recruitment platform. This project provides a starter backend template designed to help you quickly deploy APIs for managing courses, job listings, applications, and recruitment workflows. The template includes a basic setup, deployment instructions, and environment configurations to get your backend running smoothly on an Amazon EC2 server.

## Features

- Node.js/Express API setup with TypeScript support
- Structured API responses using `ApiResponse` utility
- Centralized error handling with global error middleware
- 404 handler for unmatched routes
- Prisma ORM for database operations
- Logging using Winston and Morgan
- Deployment-ready Dockerfile and environment management
- Ready for CI/CD pipeline integration

### Job Module
- [x] Filtering, sorting, and pagination for job listings
- [x] Data validation and DTO layer for clean API input
- [x] Caching improvements for filtered job lists
- [x] Job application integration
- [x] Authorization rules for job ownership
- [x] Soft delete and job status handling
- [x] Performance optimizations (query select, indexing)

#### API Routes

| Method     | Endpoint                         | Description                                 | Auth Required         |
| ---------- | -------------------------------- | ------------------------------------------- | --------------------- |
| **GET**    | `/api/jobs`                      | Get all jobs (optional filters, pagination) | ❌                     |
| **GET**    | `/api/jobs/:id`                  | Get a job by ID                             | ❌                     |
| **POST**   | `/api/jobs`                      | Create a new job posting                    | ✅ (Admin / Recruiter / Super Admin)                    |
| **PUT**    | `/api/jobs/:id`                  | Update job details by ID                    | ✅ (Job owner) |
| **DELETE** | `/api/jobs/:id`                  | Delete a job (soft delete)                  | ✅ (Job owner) |
| **GET**    | `/api/companies/:companyId/jobs` | Get jobs for a specific company             | ❌                     |
| **GET**    | `/api/jobs/search`               | Search jobs by title, location, or keywords | ❌                     |


#### Query Parameters for /api/jobs
| Parameter   | Type   | Description                                                                           |
| ----------- | ------ | ------------------------------------------------------------------------------------- |
| `location`  | string | Filter jobs by location                                                               |
| `type`      | enum   | Filter by job type (values from `JobType` enum, e.g., `FULL_TIME`, `PART_TIME`, etc.) |
| `companyId` | string | Filter by company ID                                                                  |
| `keyword`   | string | Search keyword in title/description                                                   |
| `page`      | number | Page number (default: `1`, min: `1`)                                                  |
| `limit`     | number | Number of results per page (default: `10`, max: `100`)                                |


## Prerequisites

- AWS Account with an EC2 instance (Ubuntu recommended)
- SSH access configured for your EC2 instance
- Node.js and npm installed locally
- Docker installed on EC2 instance (optional, for Docker deployment)


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

## API Response Structure
All API responses follow a consistent structure using the ApiResponse utility.

### Success Response: 
```
{
  "success": true,
  "data": {
    "id": "123",
    "phoneNumber": "9876543210"
  },
  "message": "User created"
}
```

### Error Response: 
```
{
  "success": false,
  "data": null,
  "message": "User with provided phoneNumber already exists",
  "errors": {
    "isOperational": true
  },
  "statusCode": 409
}
```

### 404 Response: 
```
{
  "success": false,
  "data": null,
  "message": "Route not found",
  "errors": {
    "url": "/api/unknown",
    "method": "GET",
    "ip": "127.0.0.1"
  },
  "statusCode": 404
}
```

### HTTP Status Codes & ApiError Classes

| Status Code | Error Class               | Description                     | Example Message                |
|------------:|---------------------------|---------------------------------|--------------------------------|
| 400         | BadRequestError / ValidationError | Bad request / Validation failed | "Bad request" / "Validation failed" |
| 401         | UnauthorizedError         | Unauthorized access             | "Unauthorized access"          |
| 403         | ForbiddenError            | Forbidden access                | "Forbidden access"             |
| 404         | NotFoundError             | Resource not found              | "Resource not found"           |
| 409         | ConflictError             | Resource conflict               | "Resource conflict"            |
| 429         | TooManyRequestsError      | Too many requests               | "Too many requests"            |
| 500         | InternalServerError       | Internal server error           | "Internal server error"        |
| 503         | TemporaryServerError      | Service temporarily unavailable | "Temporary server error"       |


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