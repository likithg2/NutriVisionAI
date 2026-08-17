# 🥗 NutriVision AI

### Smart Food Calorie & Nutrition Analyzer

NutriVision AI is an AI-powered nutrition analysis web application designed to help users understand the nutritional content of food quickly and conveniently.

The application provides a simple interface for analyzing food and obtaining nutritional insights such as **calories, macronutrients, vitamins, and minerals**. It supports food-photo analysis and food searching, making nutrition information easier to access without manually searching through extensive nutrition databases.

---

## ✨ Features

* 📸 **AI-Powered Food Analysis**

  * Analyze food using images.
  * Identify food and obtain nutritional information.

* 🔎 **Food Search**

  * Search through a large food database.
  * Supports access to information for **300K+ foods**.

* 🔥 **Calorie Analysis**

  * View estimated calorie information for food.

* 💪 **Macronutrient Breakdown**

  * Get nutritional information covering major macronutrients.

* 🧬 **Micronutrient Information**

  * Provides information about vitamins and minerals.

* 📊 **Interactive Nutrition Visualization**

  * Uses interactive charts to present nutritional information in an easier-to-understand format.

* 📱 **Responsive Web Interface**

  * Designed to work across modern screen sizes.

---

## 🎯 Objective

The objective of NutriVision AI is to simplify nutritional analysis by combining an easy-to-use web interface with AI-powered food analysis.

Instead of manually searching nutritional databases and calculating nutritional values, users can use the application to obtain food-related nutrition information through a streamlined workflow.

---

## 🛠️ Technology Stack

| Technology           | Purpose                                      |
| -------------------- | -------------------------------------------- |
| **HTML5**            | Application structure                        |
| **TypeScript**       | Type-safe application development            |
| **Vite**             | Development server and production build tool |
| **Chart.js**         | Interactive nutrition data visualization     |
| **Google Gemini AI** | AI-powered food analysis                     |

The project is configured as an ES module application and uses Vite for development and production builds.

Chart.js is included as the project's application dependency.

---

## 🏗️ Project Structure

```text
NutriVision-AI/
│
├── src/
│   └── main.js
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

The application entry point is loaded from `src/main.js` through the main HTML document.

---

## ⚙️ Prerequisites

Before running the project, make sure you have:

* **Node.js**
* **npm**
* A modern web browser
* Required AI/API configuration if AI-powered functionality in the source requires an external API key

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/likithg2/Smartshelf-AI.git
cd Smartshelf-AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite will start the development server and provide a local URL that can be opened in your browser.

---

## 🔨 Available Commands

### Development

```bash
npm run dev
```

Starts the Vite development server.

### Production Build

```bash
npm run build
```

Runs TypeScript compilation followed by the Vite production build.

### Preview Production Build

```bash
npm run preview
```

Starts a local server for previewing the production build.

---

## 📊 Nutrition Analysis

NutriVision AI is designed to present food information in a structured format, including:

* Calories
* Macronutrients
* Vitamins
* Minerals
* Other available nutritional information

The application uses visual data presentation to make nutrition information easier to interpret.

---

## 🤖 AI Integration

The application is designed around AI-powered food analysis using **Google Gemini AI**.

The AI component is intended to assist with interpreting food information and generating nutritional insights from food images.

> **Note:** API credentials should never be committed directly to the Git repository. Use environment variables or another secure configuration mechanism for sensitive credentials.

---

## 📈 Data Visualization

NutriVision AI uses **Chart.js** to provide interactive visualization of nutritional information.

Charts can make comparisons between nutritional components easier to understand than presenting raw numbers alone.

The project currently declares Chart.js `4.5.1` as its dependency.

---

## 🔐 Security

When configuring external AI services or APIs:

* Do not commit API keys to GitHub.
* Store secrets in environment variables.
* Keep `.env` files out of version control.
* Do not expose private credentials in client-side source code.

---

## 🌐 SEO & Metadata

The application includes metadata for search engines and social sharing, including:

* Application title
* Description
* Keywords
* Author information
* Open Graph metadata

The defined application title is **"NutriVision AI — Smart Food Calorie & Nutrition Analyzer"**.

---

## 💡 Use Cases

NutriVision AI can be useful for:

* 🍽️ Understanding the nutritional value of meals
* 🔥 Monitoring calorie intake
* 💪 Tracking macronutrients
* 🧬 Exploring vitamins and minerals
* 📱 Quickly analyzing food using images
* 🔎 Searching for nutritional information about foods

---

## 🔮 Future Enhancements

Potential improvements for future versions include:

* 👤 User accounts and personalized profiles
* 📅 Daily and weekly nutrition tracking
* 🎯 Personalized calorie and nutrition goals
* 📊 Long-term nutrition analytics
* 🍱 Meal history
* 📝 Manual meal logging
* 🥘 Meal and recipe recommendations
* 📱 Progressive Web App support
* 🔔 Nutrition and meal reminders
* 📈 Advanced nutrition dashboards
* 🧠 More detailed AI-powered dietary recommendations

---

## ⚠️ Disclaimer

NutriVision AI is intended for **informational and educational purposes**.

Nutritional values generated through AI or food databases may be estimates and can vary depending on ingredients, preparation methods, serving sizes, and other factors.

This application should not be considered a replacement for professional medical or nutritional advice.

---

## 👨‍💻 Development

The project uses TypeScript with modern ES module and bundler configuration. The TypeScript configuration targets **ES2023**, uses browser DOM libraries, and uses Vite's client types.

---

## 📄 License

No license information was provided in the supplied project files.

If this project is intended to be publicly reusable, add an appropriate license such as **MIT** after confirming the licensing requirements for the project and its dependencies.

---

## ⭐ Project

**NutriVision AI**
*Making food and nutrition analysis simpler with AI.*

Repository: `https://github.com/likithg2/Smartshelf-AI`
