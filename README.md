# TrackNFresh - Server Side

This is the backend API for **TrackNFresh**, a food expiry tracker web application that enables users to efficiently monitor, manage, and track their perishable food items.

## 🔗 Live URL

API Base URL : [Click Here](https://track-n-fresh-server.vercel.app)

## Tech Stack
- **Node.js**
- **Express.js**
- **MongoDB (MongoDB Atlas)**
- ****Firebase Admin SDK** (JWT Authentication)**
- **dotenv for environment configuration**
- **Vercel** (deployment)

## Features
- **RESTful API** endpoints for foods management and user actions
- **JWT-based** Auth using Firebase
- CRUD operations on food items
- Role-based access via token verification
- Clean code structure with modular routing
- **Environment Variable Support** using `dotenv`
- **CORS Configured** for secure frontend-server communication

---
## API Endpoints

| Method | Endpoint                    | Description                                          |
|--------|-----------------------------|----------------------------------------------------- |
| POST   | `/auth/register`            | Register a new user                                  |
| POST   | `/food/add`                 | Add a new food item (JWT protected)                  |
| GET    | `/food/all`                 | Get all food items                                   |
| GET    | `/food/my-items?email=`     | Get food items added by the authenticated user (JWT) |
| GET    | `/food/nearest-expiring`    | Get food items expiring within the next 5 days       |
| GET    | `/food/expired`             | Get all expired food items                           |
| GET    | `/food/:id`                 | Get a specific food item by ID                       |
| PUT    | `/food/update/:id`          | Update a food item by ID (JWT protected)             |
| PUT    | `/food/update/note/:id`     | Add a note to a food item (JWT protected)            |
| DELETE | `/food/delete/:id`          | Delete a food item by ID (JWT protected)             |
| DELETE | `/food/:id/note`            | Delete a note from a food item (JWT protected)       |

---
## How to Install & Run Locally

Follow these steps to run the project on your local machine:

1. Clone the Repository

```sh
git clone git@github.com:Shahriar-Utchas/TrackNFresh-server.git
```
2. Go to the project folder ```cd TrackNFresh-server```
3. Install Project Dependencies
```sh
npm install
```
4. Create a .env File
```sh
# MongoDB credentials
DB_USER=your_mongo_username
DB_PASS=your_mongo_password
# Firebase Admin SDK private key (Base64-encoded JSON)
FIREBASE_SERVER_KEY=base64_encoded_service_account_json
```
5. Start the server ```nodemon index.js```
6. Open your browser and run APIs from: http://localhost:3000

## 🔗 Client-Side Repository

To see the frontend/client-side of this project, visit:  [**TrackNFresh Client-Side Repository**](https://github.com/Shahriar-Utchas/TrackNFresh-client)
