# Hall Ticket Generator

A web-based Hall Ticket Generator built using:

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose

This project allows users to create, edit, save, load, delete, and manage multiple hall ticket profiles.

---

## Features

### Hall Ticket Management

- Edit Hall Ticket directly from the website
- Change:
  - Exam Session
  - Roll Number
  - Candidate Name
  - Gender
  - Father's Name
  - Course
  - Semester

### Image Upload

- Candidate Photo Upload
- Candidate Signature Upload

### Profile System

- Save multiple profiles
- Load saved profiles instantly
- Update existing profiles
- Delete profiles
- Create new blank profile

### Database

- MongoDB Atlas integration
- Data remains available after:
  - Browser refresh
  - Device restart
  - New login session

### PDF Export

- Download Hall Ticket as PDF
- Print-ready layout

---

## Project Structure

```txt
Hall-ticket/
│
├── demo.html
├── style.css
├── script.js
│
├── logo.jpeg
├── candidatee photo.jpeg
├── candidate sign.jpeg
├── director sign.jpeg
│
└── backend/
    │
    ├── server.js
    ├── package.json
    ├── package-lock.json
    │
    ├── models/
    │   └── HallTicket.js
    │
    └── routes/
        └── hallTicket.js
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/mahendratiwari969668/Hall-ticket.git
```

### Open Project

```bash
cd Hall-ticket
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

```env
MONGODB_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
PORT=5000
```

Example:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hallticket
PORT=5000
```

---

## Run Backend

```bash
cd backend
npm start
```

Expected Output:

```txt
MongoDB connected successfully
Server running on http://localhost:5000
```

---

## Run Frontend

Open:

```txt
demo.html
```

or use VS Code Live Server.

Example:

```txt
http://127.0.0.1:5501/demo.html
```

---

## How To Use

### Create New Hall Ticket

1. Click **New Profile**
2. Enter student details
3. Upload photo
4. Upload signature
5. Click **Save Data**

---

### Load Existing Profile

1. Click **Saved Profiles**
2. Select profile
3. Data loads automatically

---

### Update Profile

1. Load profile
2. Edit details
3. Click **Save Data**

---

### Delete Profile

1. Open Saved Profiles
2. Click Delete
3. Confirm deletion

---

### Download PDF

1. Open desired profile
2. Click **Download PDF**
3. PDF will be downloaded automatically

---

## Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MongoDB Atlas
- Mongoose

---

## Author

Mahendra Tiwari

GitHub:
https://github.com/mahendratiwari969668

---

## License

This project is for educational and personal use.
