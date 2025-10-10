# Backend - FindMyStuff (Lost & Found Portal)

This is the **backend** of the FindMyStuff Lost & Found Portal for colleges/campuses.  
It handles user authentication, lost/found item posting, and communication with the database.

Built with **Node.js, Express, MongoDB, and JWT authentication**.

---

## 🚀 Features

- User signup & login with college email validation  
- JWT-based authentication  
- MongoDB Atlas for database storage  
- Password hashing with bcrypt  
- Environment variable configuration  
- REST API endpoints for frontend integration  

---

## 🛠️ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later recommended)  
- [npm](https://www.npmjs.com/)  
- MongoDB Atlas account (or local MongoDB server)  

---

## ⚙️ Setup Instructions

1. **Clone the repository:**

```bash
git clone https://github.com/harshitabisht05/backend_lostandfound.git
cd backend_lostandfound
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create a .env file in the root directory with the following content:**

```bash
PORT=5000
MONGO_URI=mongodb+srv://harshita102017_db_user:7VbXzmVmHF4NTILP@findmystuff.ajtlnvq.mongodb.net/?retryWrites=true&w=majority&appName=findmystuff
JWT_SECRET=8642babb91b4aec22c46507851e5d34edebc76d6705bbca9eb830230fb35471495c3fdda90bae4e436133e12fd80b4f0a88457cefcf38413a02ba6b899162023
```

4. **Run the backend server:**

```bash
node server.js
```
It should say(on terminal):
🚀 Server running on port 5000
✅ MongoDB connected

The server should start at: http://localhost:5000

### MongoDB setup:
- Go to [MongoDB](https://www.mongodb.com/)
- Login with my id.
- Go to :
  Clusters > findmystuff > Collections > test > users(for now)
- Under user you can see all user registerd.
- 
## 🗂️ Project Structure
```bash
backend_lostandfound/
├─ controllers/       # Route handlers
├─ models/            # Mongoose schemas
├─ routes/            # Express routes
├─ .env               # Environment variables
├─ server.js          # Main server file
├─ package.json       # Project dependencies
└─ README.md
```
