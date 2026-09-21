# 🥗 NutriVision AI

### Smart Food Calorie & Nutrition Analyzer

NutriVision AI is an AI-powered smart nutrition and inventory management web application. It combines cutting-edge AI vision capabilities with intuitive dashboard features to help users track their food intake, manage their kitchen inventory (SmartShelf), and generate intelligent recipes and shopping lists based on what they already have at home.

### 📄 Resume Summary
**NutriVision AI** is a full-stack health & nutrition platform that uses Google Gemini AI to analyze food photos, log macros, and manage kitchen inventory to prevent food waste. Built with a responsive **React + Tailwind CSS** frontend featuring Framer Motion animations and dark/light modes. The robust backend runs on **Node.js, Express, and Sequelize**, featuring JWT authentication, automated background CRON jobs for expiration alerts, and comprehensive user activity tracking. The platform dynamically generates custom recipes and smart shopping lists based on available inventory, combining AI vision, custom logic, and modern UX design to offer a seamless, personalized health-tracking experience.

---

## ✨ Key Features

* 📸 **AI-Powered Food Scanner & Calorie Tracking**
  * Snap or upload a photo of your meal and let the Google Gemini AI instantly identify the food, estimate portion sizes, and log accurate macronutrients (Protein, Carbs, Fat) and calories.
  * Interactive charts for 7-day calorie trends and macro breakdowns.
  
* 🛒 **SmartShelf (Inventory Management)**
  * Track your kitchen inventory in real-time.
  * Add items using the AI scanner or the integrated USDA food database.
  * Get alerts for items expiring soon to reduce food waste.
  * View money saved from consumed vs. wasted items.

* 🧑‍🍳 **AI Recipe Generator (Kitchen)**
  * Generate personalized, delicious recipes using strictly the ingredients currently available in your SmartShelf inventory.
  * Customize by dietary preferences (Vegan, Keto, High-Protein, etc.).

* 📋 **Smart Shopping List**
  * Automatically analyzes your SmartShelf inventory and upcoming meal plans to generate a context-aware shopping list, predicting what you need before you run out.

* 💬 **NutriVision AI ChatBot**
  * A dedicated AI assistant to answer personalized nutrition questions, provide dietary advice, and help you meet your health goals.

* 🏃‍♂️ **Activity & Workout Tracker**
  * Log exercises, workouts, and daily steps to balance your calorie intake.
  * View comprehensive insights into your fitness trends.

* 💊 **Smart Medicine Tracking**
  * Track your medicines inside the SmartShelf.
  * Medicines are securely excluded from AI macro-analysis and recipe recommendations to ensure food safety and precision.

* 🌍 **Global Translation (Native Integration)**
  * Fully integrated Google Translate allows you to seamlessly view the entire application in your preferred language without intrusive ribbons.

* 📱 **Responsive & Aesthetic UI**
  * Built with a modern, glassmorphism UI using Tailwind CSS and Framer Motion for buttery-smooth page transitions.
  * Full Dark/Light mode support.

## 🚀 Recent Updates & Enhancements
- **Customized History (Activity Log):** Upgraded the Activity page to a full History tracking system with dedicated filters (Logged Meals, Expired Items, Added Items, Used Items).
- **Smart Kitchen Flow:** Seamlessly log cooked AI recipes into the Calorie Tracker. Recipes dynamically move to a dedicated Cooking History modal upon logging.
- **Account Security:** Implemented secure OTP-based account deletion.
- **Automated Expiry Tracking:** A background CRON job tracks expiring inventory and sends automated email and in-app push notifications when items expire.
- **Native Language Toggle:** Custom-built Google Translate integration allows 1-click toggling between English and Kannada without intrusive widgets or banners.

---

## 🛠️ Technology Stack

| Category         | Technologies Used                               |
| ---------------- | ----------------------------------------------- |
| **Frontend**     | React, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React, React Router |
| **Backend**      | Node.js, Express.js, Sequelize ORM (SQLite / PostgreSQL) |
| **Authentication**| JWT (JSON Web Tokens), bcryptjs, OTP verification |
| **AI Integration**| Google Gemini API (`gemini-3.5-flash-lite`) using the official `@google/genai` SDK |
| **Other Tools**  | node-cron, Multer (image uploads), Markdown parsing (react-markdown) |

---

## 🏗️ Project Structure

```text
NutriVisionAi/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route handlers for auth, inventory, tracker, ai, etc.
│   │   ├── models/        # Sequelize DB models (User, InventoryItem, CalorieLog, Activity)
│   │   ├── routes/        # Express API routes
│   │   ├── utils/         # Helper functions & CRON jobs
│   │   └── server.js      # Main Express application entry point
│   ├── uploads/           # Image storage for scanners
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components (Navbar, Modals, AppShell, GlassCard)
│   │   ├── pages/         # Main screens (Dashboard, SmartShelf, Tracker, Kitchen, ChatBot, History)
│   │   ├── context/       # React Context API providers (Auth, Theme, Inventory, Kitchen)
│   │   ├── api/           # Axios interceptors and API wrappers
│   │   ├── App.jsx        # Routing and Layout transitions
│   │   └── main.jsx
│   ├── public/            # Static assets and backgrounds
│   └── package.json
│
└── README.md
```

---

## ⚙️ Prerequisites

* **Node.js** (v18 or higher)
* **npm** or **yarn**
* A **Google Gemini API Key** (for the AI scanner, chatbot, and recipe generator)

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/likithg2/calorie-ai.git
cd calorie-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add your credentials:
```env
PORT=5000
DATABASE_URL=sqlite:./database.sqlite # or your Postgres URL
GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_jwt_secret
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 🔐 Security Note
* Never commit your `.env` file containing API keys or JWT secrets to version control.
* This project is configured to ignore `.env` files automatically via `.gitignore`.

---

## ⭐ Project Information
**NutriVision AI** — *Making food and nutrition analysis simpler, smarter, and more aesthetic with AI.*

Repository: `https://github.com/likithg2/calorie-ai`
