# Chatify 💬

A modern, real-time chat application built with cutting-edge web technologies. Chatify enables seamless communication through instant messaging, voice/video calls, and group conversations.

**Created by:** [Nitish](https://github.com/thenitishmind)

---

## 🎯 Features

- ✨ **Real-time Messaging** - Instant message delivery with live updates
- 📱 **User Authentication** - Secure login with Firebase Authentication
- 👥 **Group Conversations** - Create and manage group chats
- 📞 **Call Management** - Track and manage voice/video calls
- 👤 **User Profiles** - Customizable profiles with avatars and status
- 🔔 **Status Updates** - Share status with 24-hour expiry
- 🎨 **Responsive Design** - Works seamlessly on all devices
- 🔐 **End-to-End Security** - Protected with modern security practices

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework with latest features |
| **Vite** | Lightning-fast build tool and dev server |
| **React Router v7** | Client-side routing and navigation |
| **Axios** | HTTP client for API calls |
| **Firebase SDK** | Authentication and real-time updates |
| **Supabase JS** | Database and real-time subscriptions |
| **GSAP** | Smooth animations and transitions |
| **CSS3** | Modern styling and responsive layouts |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | Web framework and API routing |
| **Firebase Admin SDK** | Backend authentication and user management |
| **Supabase** | PostgreSQL database and real-time API |
| **Multer** | File upload and avatar handling |
| **CORS** | Cross-origin resource sharing |
| **Dotenv** | Environment variable management |

### Database & Services
| Service | Purpose |
|---------|---------|
| **Supabase (PostgreSQL)** | Primary database for all data |
| **Firebase** | Authentication and user management |
| **Render** | Cloud deployment platform |

---

## 📋 Workflow

### User Registration & Authentication Flow
```
User Input → Firebase Auth → Verify User → Sync to Database → Create Profile
```

### Real-time Messaging Flow
```
Message Input → API Request → Database Store → Real-time Subscription → Live Update
```

### Conversation Management
```
Create/Join Conversation → Load Messages → Subscribe to Changes → Display Updates
```

### Call Management Flow
```
Initiate Call → Log to Database → Notify User → Track Call Duration → Save History
```

### User Status Flow
```
Update Status → Upload Media → Store in Database → Broadcast to Connections → 24-hr Expiry
```

---

## 🚀 Project Structure

```
chatify/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebase-admin.js      # Firebase Admin initialization
│   │   │   └── supabase.js             # Supabase client setup
│   │   ├── controllers/
│   │   │   ├── authController.js       # Auth logic
│   │   │   ├── messageController.js    # Message operations
│   │   │   ├── conversationController.js # Conversation logic
│   │   │   ├── userController.js       # User operations
│   │   │   ├── statusController.js     # Status management
│   │   │   └── callController.js       # Call tracking
│   │   ├── middleware/
│   │   │   ├── auth.js                 # JWT verification
│   │   │   └── errorHandler.js         # Global error handling
│   │   ├── routes/
│   │   │   ├── auth.js                 # Auth endpoints
│   │   │   ├── users.js                # User endpoints
│   │   │   ├── messages.js             # Message endpoints
│   │   │   ├── conversations.js        # Conversation endpoints
│   │   │   ├── status.js               # Status endpoints
│   │   │   └── calls.js                # Call endpoints
│   │   └── server.js                   # Main server file
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/                 # Reusable components
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── ProfileSetup.jsx
│   │   │   ├── call/
│   │   │   │   ├── CallScreen.jsx
│   │   │   │   ├── CallControls.jsx
│   │   │   │   └── IncomingCallModal.jsx
│   │   │   └── chat/
│   │   │       ├── ChatLayout.jsx
│   │   │       ├── ChatWindow.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       ├── MessageInput.jsx
│   │   │       ├── MessageBubble.jsx
│   │   │       ├── UserSearch.jsx
│   │   │       ├── GroupCreate.jsx
│   │   │       ├── ProfileSettings.jsx
│   │   │       └── StatusBar.jsx
│   │   ├── hooks/
│   │   │   ├── useMessages.js          # Message hook
│   │   │   ├── useConversations.js     # Conversation hook
│   │   │   └── useCalls.js             # Call hook
│   │   ├── services/
│   │   │   ├── api.js                  # API client
│   │   │   ├── firebase.js             # Firebase config
│   │   │   └── supabase.js             # Supabase config
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # Auth context
│   │   │   └── CallContext.jsx         # Call context
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── database/
│   ├── migration.sql                   # Initial schema
│   └── migration_v2.sql                # Updated schema
│
├── render.yaml                         # Render deployment config
├── DEPLOYMENT.md                       # Deployment guide
└── README.md                           # This file
```

---

## 🏃 Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- Supabase project

### Setup

**1. Clone & Install**
```bash
git clone https://github.com/thenitishmind/Chatify.git
cd chatify
```

**2. Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Add your Firebase & Supabase credentials to .env
npm run dev
# Backend runs on http://localhost:5000
```

**3. Frontend Setup**
```bash
cd ../frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Available Scripts

**Backend:**
```bash
npm start    # Production mode
npm run dev  # Development with nodemon
```

**Frontend:**
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/verify` | Verify & sync user |
| PUT | `/api/auth/profile` | Update user profile |
| POST | `/api/auth/avatar` | Upload avatar |
| GET | `/api/auth/check-username/:username` | Check username availability |
| POST | `/api/auth/logout` | Logout user |

### Users
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users` | Get user info |
| GET | `/api/users/search` | Search users |

### Conversations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/conversations` | Get all conversations |
| POST | `/api/conversations` | Create conversation |
| POST | `/api/conversations/group` | Create group |

### Messages
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/messages/:conversationId` | Get messages |
| POST | `/api/messages` | Send message |

### Status
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/status` | Get status |
| PUT | `/api/status` | Update status |

### Calls
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/calls` | Get call history |
| POST | `/api/calls` | Log call |
| POST | `/api/calls/end` | End call |

---

## 🌐 Deployment

### Render Deployment
The project includes a `render.yaml` file for easy deployment on Render:

1. Push code to GitHub
2. Connect repository to Render
3. Configure environment variables
4. Deploy using Blueprint

For detailed deployment steps, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Environment Variables

**Backend (.env)**
```
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.onrender.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-role-key
SUPABASE_KEY=your-anon-key
```

**Frontend (.env)**
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Firebase security rules
- ✅ CORS protection
- ✅ Environment variable protection
- ✅ Secure file upload validation
- ✅ Error handling middleware

---

## 🐛 Troubleshooting

### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check API endpoint configuration

### Firebase Errors
- Ensure service account credentials are correct
- Check Firebase project permissions

### Supabase Connection
- Verify URL and API keys
- Check database migrations have run

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `npm run build -- --reset-cache`

---

## 📚 Database Schema

Key tables in Supabase:
- `profiles` - User profiles with username, avatar, bio
- `conversations` - Direct and group conversations
- `messages` - Chat messages with media support
- `calls` - Call history and logs
- `status_stories` - 24-hour status updates

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions, please open an [issue on GitHub](https://github.com/thenitishmind/Chatify/issues).

---

## 👨‍💻 Author

**Nitish** - Full Stack Developer

- GitHub: [@thenitishmind](https://github.com/thenitishmind)
- Email: nitis@example.com

---

<div align="center">

**Built with ❤️ by Nitish**

⭐ Star this repo if you find it helpful!

</div>