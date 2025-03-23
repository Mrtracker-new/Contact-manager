# RNR Contact Manager

![React](https://img.shields.io/badge/React-18-blue)
![Material UI](https://img.shields.io/badge/Material_UI-5-purple)
![Capacitor](https://img.shields.io/badge/Capacitor-4-green)

A modern, cross-platform contact management application built with React and Capacitor, designed to simplify contact organization with rich document attachment capabilities.

## 📱 Screenshots

<div align="center">
  <img src="public/images/screenshots/app_contact_view.png" alt="Home Screen" width="300"/>
  <img src="public/images/screenshots/app_document_add.png" alt="Add Contact" width="300"/>
  <img src="public/images/screenshots/app_document_preview.png" alt="Contact Details" width="300"/>
</div>


## 🌟 Key Features

- **Rich Contact Profiles**: Store comprehensive contact information including photos, addresses, and notes
- **Document Management**: Attach and manage multiple document types (PDF, images, text files, Word docs)
- **Tagging & Categorization**: Organize contacts with custom tags and group assignments
- **Cross-Platform**: Works on web browsers and as a native Android application
- **Offline-First**: Full functionality without requiring constant internet connection
- **Responsive Design**: Optimized for both desktop and mobile experiences

## 🚀 Why RNR Contact Manager?

In today's connected world, effective contact management goes beyond storing names and phone numbers. RNR Contact Manager addresses several critical needs:

- **Document Association**: Attach important files directly to contacts (contracts, receipts, ID documents)
- **Organization**: Easily categorize and find contacts using tags and groups
- **Accessibility**: Access your contacts across devices with consistent experience
- **Privacy**: Your data stays on your device with secure local storage

## 📱 Installation

### 💻Web Version

**Clone the repository**
    
    git clone https://github.com/Mrtracker-new/Contact-Manager.git

**Install dependencies**

    cd Contact-Manager
    npm install

**Start development server**
   
    npm start

### 📲Android App

**Build the web app**

    npm run build

**Sync with Capacitor**

    npx cap sync android

**Open in Android Studio**

    npx cap open android

## 💻 Technologies Used
- Frontend : React, Material UI
- Mobile Framework : Capacitor
- Storage : Capacitor Preferences, LocalStorage
- State Management : React Context API
- Navigation : React Router
## 📋 Usage Examples
- Business Professionals : Store client information with attached contracts and meeting notes
- Healthcare Workers : Maintain patient contact details with relevant medical documents
- Personal Use : Organize friends and family contacts with shared photos and important documents
- Service Providers : Keep track of customer information with service agreements and receipts

## 🔧 Configuration
The application can be configured through the capacitor.config.json file to adjust permissions and behavior on mobile platforms.

## 👨‍💻 About the Developer
I'm Roland Lobo, a developer focused on creating practical applications that solve real-world problems. This project combines my passion for React development and creating intuitive user experiences.

- GitHub: Mrtracker-new
- Email: rolanlobo901@gmail.com

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
