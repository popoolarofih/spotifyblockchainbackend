# Spotify Airdrop Backend

This is the backend service for a Spotify-based airdrop application. It handles user authentication via Spotify, manages user data in a Supabase database, and provides API endpoints for a user dashboard and airdrop claiming.

## Features

- **Spotify Authentication**: Secure user login and signup using Spotify OAuth 2.0.
- **User Dashboard**: An endpoint to retrieve user information, including username, email, points, and a personal referral link.
- **Point Allocation**:
  - New users receive a base of 1000 points.
  - Spotify Premium users get an additional 500 points.
- **Referral System**: Each user gets a unique referral link to share. (Note: The logic for awarding points for referrals needs to be implemented when a new user signs up using a referral link).
- **Airdrop Claiming**: A placeholder endpoint that allows users to claim an airdrop, with a 3-day cooldown period between claims.
- **API Documentation**: Interactive API documentation available through Swagger UI.

## Tech Stack

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js.
- **Supabase**: Backend-as-a-Service for database and authentication.
- **Swagger**: API documentation and testing.
- **PostgreSQL**: The underlying database used by Supabase.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (which includes npm)
- A [Supabase](https://supabase.com/) account.
- A [Spotify for Developers](https://developer.spotify.com/dashboard/) account.

## Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    - Create a new project on your [Supabase Dashboard](https://app.supabase.io).
    - Navigate to the **SQL Editor**.
    - Copy the content of the `schema.sql` file from this project and run it to create the `users` table.

4.  **Set up Spotify Developer App:**
    - Go to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications).
    - Create a new application.
    - Note down your **Client ID** and **Client Secret**.
    - Go to the app settings and add a **Redirect URI**. For local development, this will be `http://localhost:3000/auth/callback` (assuming the default port is 3000).

5.  **Configure Environment Variables:**
    - Make a copy of the `.env.example` file and name it `.env`.
    - Open the `.env` file and fill in the required values:
      - `SUPABASE_URL`: Your Supabase project URL.
      - `SUPABASE_ANON_KEY`: Your Supabase project's `anon` public key.
      - `SPOTIFY_CLIENT_ID`: Your Spotify app's Client ID.
      - `SPOTIFY_CLIENT_SECRET`: Your Spotify app's Client Secret.
      - `JWT_SECRET`: A long, random, and secret string for signing JWTs.
      - `FRONTEND_URL`: The URL of your frontend application (e.g., `http://localhost:3001`).
      - `PORT`: The port for the server to run on (defaults to 3000).

## Running the Application

-   **Development Mode:**
    This command starts the server with `nodemon`, which will automatically restart the server on file changes.
    ```bash
    npm run dev
    ```

-   **Production Mode:**
    This command starts the server in a standard way.
    ```bash
    npm start
    ```

The server will be running at `http://localhost:3000` (or your specified port).

## API Endpoints

The API is documented using Swagger. Once the server is running, you can access the interactive API documentation at:

[`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)

From the Swagger UI, you can view all available endpoints, see their request/response formats, and test them directly from your browser.
