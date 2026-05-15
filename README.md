# Chat_App_Discord

## Overview

**Chat_App_Discord** is a real-time chat application inspired by Discord, built using the MERN stack. It enables users to create channels, send messages, and manage their profiles. The platform is designed to support community-building through text and voice communication in a responsive and interactive environment.

## Demo

Check out the live demo: [MERN_Discord Demo](https://mern-discord-front-end.onrender.com)

### SPA routing on Render (fix 404 when refreshing)

React Router needs every path to serve `index.html`. **Pick one:**

1. **Static Site (recommended)** — [Render Dashboard](https://dashboard.render.com) → your frontend service → **Redirects / Rewrites** → add:
   - Source: `/*` → Destination: `/index.html` → Action: **Rewrite**

   Or link this repo’s [`render.yaml`](./render.yaml) via **Blueprint** / **Infrastructure as Code** (same rewrite is defined there).

2. **Web Service (alternative)** — Root directory `client`, build `npm install && npm run build`, start `npm start` (uses `serve -s` for SPA fallback).

## Features

- **User Authentication**: Secure user registration and login functionality ensures a personalized experience.
- **Real-Time Messaging**: Powered by Socket.IO, users can send and receive messages in real-time, with updates appearing instantly across all connected devices.
- **Channel Creation**: Users can create and join channels, allowing for organized communication around specific topics or groups.
- **Profile Management**: Users can update their profiles, including avatars, usernames, and personal information, to customize their presence on the platform.
- **Responsive Design**: Enjoy a smooth user experience across all devices, with a fully responsive design optimized for both desktop and mobile use.






## Technologies Used

### Frontend

- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast development build tool that provides a great developer experience.

### Backend

- **Node.js**: A JavaScript runtime for server-side development.
- **Express**: A minimal and flexible Node.js web application framework.

### Database

- **MongoDB**: A NoSQL database used to store all application data, including user information, hotel details, and bookings.
