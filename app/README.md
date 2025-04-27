# Adam Maritime Intelligence System (AMIS)

A modern platform for vessel tracking and maritime data analysis.

## Overview

AMIS collects, streams, and analyzes maritime data from various sources including AIS scanners, global AIS data streams, and satellite imagery to provide comprehensive vessel tracking and analysis.

## Features

- Real-time vessel tracking on an interactive map
- Chat interface with AI assistant for maritime intelligence queries
- Multi-source data integration (AIS, satellite imagery, camera)
- Clean, modern UI with dark/light mode support

## Technology Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Mapbox GL for map visualization
- Tailwind CSS for styling
- Schibsted Grotesk font for clean typography

## Getting Started

### Prerequisites

- Node.js 18+
- A Mapbox account with an access token

### Environment Setup

1. Copy the example environment file and add your Mapbox token:

```bash
cp .env.example .env
```

2. Edit the `.env` file and add your Mapbox access token:

```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

### Installation

Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Architecture

The application is structured with clean code principles:

- `/components` - UI components organized by feature
- `/lib` - Core business logic, adapters, and utilities
- `/app` - Next.js app router setup and API routes

## Data Sources

- Local AIS Scanner: Physical scanner for nearby ships
- Global AIS Data: From aisstream.io
- Satellite Imagery: From Maxar
- Real-time Camera: From device cameras

## Security

This application follows security best practices for API credential management:

- Server-side secrets: All sensitive API tokens (starting with `sk.`) are kept server-side only
- Public tokens: Only public tokens (starting with `pk.`) are exposed to the client
- API proxying: All requests to external APIs that require secret tokens are proxied through our server 
- Environment separation: Different environment variables are used for client vs. server contexts

### API Keys

The application uses two types of Mapbox tokens:

1. `MAPBOX_ACCESS_TOKEN` (secret token) - Used only in server-side API routes
2. `NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN` (public token) - Used for client-side map rendering

Never expose secret tokens in client-side code or commit them to version control.

## Project Status

This project is in active development.