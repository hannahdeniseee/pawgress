# Setup Guide

## Download Prerequisite
Install node.js: https://nodejs.org/en/download

## Clone Repository
```
git clone https://github.com/hannahdeniseee/pawgress.git
cd pawgress
```

## Install Dependencies
```
npm install
```

## Install Backend Dependencies
```
cd backend
npm install
node index.js
```
Make sure you have an .env file inside the backend folder.

## Set up the Database
Make sure MySQL is running (e.g. via XAMPP).
Make sure that a pawgress database exists. If not, run this in MySQL:
```
CREATE DATABASE pawgress;
USE pawgress;
```

## Generate the Prisma Client
```
npx prisma generate
npx prisma migrate dev
```

## Run the Backend and Frontend
### Note: Must be on separate terminals
```
node index.js
npm run dev
```

## Install Dependencies for Testing
```
npm install -D vitest
npm install -D supertest
```

## Run Tests
```
npm test
```
