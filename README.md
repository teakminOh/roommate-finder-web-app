# 🏠 RoomMate Finder – Web Application for Flatmate Matching

This is a full-stack web application that helps users find compatible flatmates or rental rooms based on preferences, location, and lifestyle. The project was developed as part of a bachelor’s thesis with a focus on responsive design, modern architecture, and serverless deployment.

## 📸 Preview
![preview](https://github.com/user-attachments/assets/c0bdec65-c06c-41dc-b7ee-d234dad15b43)


## 🔍 Features

- 🔐 User authentication with Firebase
- 👤 Two user roles:
  - **Flatmate** – looking for a place or other roommates
  - **Room Provider** – offering a room or property
- 📍 Filter rooms/people by location, budget, and preferences
- 📬 Real-time chat using Firebase Firestore
- 🤝 Smart matching system based on weighted preferences
- 🗘️ Map with route visualization and travel time (Google Maps API)
- 📸 Upload photos for rooms or profiles
- 💡 Responsive design for both mobile and desktop

## 🧱 Tech Stack

| Layer        | Technology                     |
|--------------|--------------------------------|
| Frontend     | Nuxt 3 (Vue 3) + Tailwind CSS  |
| Backend      | Firebase Cloud Functions       |
| Database     | Firebase Firestore             |
| Auth         | Firebase Authentication        |
| Hosting      | Firebase Hosting               |
| Maps         | Google Maps JavaScript & Directions API |

## 📁 Project Structure

```
├── components/        # Vue/Nuxt components (Navbar, RoomItem, etc.)
├── pages/             # Nuxt pages (home, search, chat, etc.)
├── composables/       # Custom composables (e.g., useCurrentUser)
├── functions/         # Firebase Cloud Functions
├── public/            # Static files (images, favicon, preview)
└── assets/            # Global styles and fonts
```

Made with ❤️ using Nuxt, Firebase, and Google Maps.
