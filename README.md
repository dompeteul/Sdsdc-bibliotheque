# Sdsdc-bibliotheque
Systeme bibliothecaire de la Societe des Sciences de Chatellerault

# 📚 Library Management System

A modern library management system with public catalog browsing and member consultation booking.

## ✨ Features

- **🔓 Public Access**: Browse and search the complete book catalog
- **👥 Member Features**: Add books and request consultations
- **🛡️ Admin Dashboard**: Manage consultation requests and system

## 🚀 Quick Start

### Online Demo
- **Frontend**: [Your Railway URL]
- **API**: [Your Railway URL]/api/health

### Default Admin Login
- Email: `admin@library.com`
- Password: `admin123`

## 🏗️ Architecture

- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **Deployment**: Railway + GitHub

## 📖 API Documentation

### Public Endpoints
- `GET /api/books` - Browse catalog
- `GET /api/books/:id` - Book details
- `GET /api/books/stats` - Library statistics

### Member Endpoints
- `POST /api/books` - Add new book
- `POST /api/consultations` - Request consultation

### Admin Endpoints
- `GET /api/consultations` - View all requests
- `PUT /api/consultations/:id` - Update request status

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
