# 📚 StudySprint

StudySprint is a real-time collaborative study platform that helps users stay focused and motivated through group study sessions.

## 🌟 Core Features

### 1. Live Study Sprints

- Create or join 25-minute study sprint rooms
- Set topics and goals for each sprint
- Optional voice/video chat functionality
- Real-time collaboration with fellow students

### 2. Sprint Timer and Progress Tracking

- Synchronized Pomodoro-style timer for all participants
- Live participant avatars and activity status
- Real-time progress updates

### 3. Smart Matchmaking

- Quick "Find Sprint" feature
- Get matched with 1-4 users sharing similar study interests
- Join existing sprints or start new ones

### 4. Task Management

- Intuitive task board interface
- Anonymous task updates for group motivation
- Track personal and group progress

### 5. Post-Sprint Reflection

- Quick 2-minute reflection after each sprint
- Share accomplishments and emoji reactions
- Build and maintain study streaks

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org) (React)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication**: Supabase Auth with Auth0 integration
- **Real-time Features**: Supabase Realtime
- **Video Chat**: WebRTC/Agora (Optional)

## 🚀 Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📝 Contributing

We welcome contributions! Please check our contribution guidelines for more information.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
