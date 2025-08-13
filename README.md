# Twitch Airdrop Backend

This is the backend service for a Twitch-based airdrop application. It handles user authentication via Twitch, manages user data in a Supabase database, and provides API endpoints for a user dashboard and airdrop claiming.

## Features

- **Twitch Authentication**: Secure user login and signup using Twitch OAuth 2.0.
- **User Dashboard**: An endpoint to retrieve user information, including username, email, points, and a personal referral link.
- **Point Allocation**:
  - New users receive a base of 1500 points upon signing up.
- **Referral System**: A fully implemented system that rewards users with 5 points for each successful referral.
  - Each user receives a unique referral link on their dashboard.
  - When a new user signs up using this link, the backend automatically awards 5 points to the referrer.
- **Airdrop Claiming**: The endpoint for claiming airdrops verifies the user's payment on the Base blockchain.
  - It requires a transaction hash as proof of payment.
  - The backend checks the transaction to ensure the correct amount was sent to the correct wallet address.
  - The 3-day claiming cooldown is only initiated after a successful on-chain verification.
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
- A [Twitch Developer](https://dev.twitch.tv/console) account.

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
    - Run the initial schema from `schema.sql` in the SQL Editor.
    - **Important**: Run the migration script `migration_twitch.sql` in the SQL Editor to adapt the database for Twitch authentication.

4.  **Set up Twitch Developer App:**
    - Go to your [Twitch Developer Console](https://dev.twitch.tv/console/apps).
    - Create a new application (or use an existing one).
    - Note down your **Client ID** and **Client Secret**.
    - Under the application settings, add an **OAuth Redirect URL**. For local development, this will be `http://localhost:3000/auth/callback` (assuming the default port is 3000).

5.  **Configure Environment Variables:**
    - Make a copy of the `.env.example` file and name it `.env`.
    - Open the `.env` file and fill in the required values, including your Supabase and Twitch credentials.

## Running the Application

-   **Development Mode:**
    ```bash
    npm run dev
    ```

-   **Production Mode:**
    ```bash
    npm start
    ```

The server will be running at `http://localhost:3000` (or your specified port).

## API Endpoints

The API is documented using Swagger. Once the server is running, you can access the interactive API documentation at:

[`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)
