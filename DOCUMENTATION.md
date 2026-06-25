# HudumaLink Kenya - System Documentation 🇰🇪

HudumaLink Kenya is a comprehensive service and product marketplace designed specifically for the Kenyan community. It emphasizes trust, safety, and local connectivity across all 47 counties.

## 1. Design System

### Color Palette (Kenyan National Colors)
- **Primary**: `#006633` (Kenyan Green) - Represents our land and growth.
- **Secondary**: `#E30000` (Kenyan Red) - Represents the spirit of our people.
- **Accent**: `#000000` (Kenyan Black) - Represents our heritage.
- **Surface**: `#FFFFFF` (Kenyan White) - Represents peace and unity.

### Typography
- **Font Family**: `Inter` (Sans-serif) - Chosen for its modern look and high legibility across all devices.
- **Scale**: Mobile-first responsive typography using Tailwind utility classes.

### UI Components
- **Framework**: Tailwind CSS (Utility-first).
- **Icons**: Lucide React.
- **Animations**: Framer Motion (`motion/react`) for smooth transitions and interactive elements.
- **Theming**: Full Dark Mode support using the `.dark` class.

---

## 2. Frontend Capabilities (React + Vite)

The frontend is built as a highly responsive Single Page Application (SPA) using React 18 and Vite.

### Core Features:
- **Dynamic Routing**: Handled by `react-router-dom`.
- **State Management**: React Hooks (`useState`, `useEffect`, `useContext`) for local and global state.
- **Auth Context**: Custom `AuthContext` to manage user sessions and real-time profile syncing.
- **Real-time Updates**: Integration with Firestore `onSnapshot` for live messaging, notifications, and transaction updates.
- **Responsive Layouts**: Desktop-first precision with mobile-first code using Tailwind's `sm:`, `md:`, `lg:` prefixes.

---

## 3. Backend Capabilities (Firebase)

The system leverages Firebase for a serverless, scalable, and secure backend.

### Database (Firestore)
- **NoSQL Structure**: Collections for `users`, `listings`, `transactions`, `messages`, `notifications`, `withdrawals`, and `disputes`.
- **Security Rules**: Robust Firestore Security Rules enforcing:
  - **Default Deny**: All access is denied unless explicitly allowed.
  - **Ownership-based Access**: Users can only modify their own data.
  - **Validation**: Strict data type and schema validation on every write.
  - **Admin Privileges**: Specialized rules for administrative actions (KYC approval, dispute resolution).

### Authentication (Firebase Auth)
- **Google Login**: Primary authentication method for ease of use and security.
- **Profile Syncing**: Automatic creation of user profiles in Firestore upon first login.

### Storage (Firebase Storage)
- **Media Hosting**: Secure storage for user profile pictures, listing images, and KYC documents (ID/Selfie).
- **Image Size Limit**: Enforced 3MB maximum file size for all user-uploaded images to ensure performance and cost-efficiency.

---

## 4. Key Functionality

### User Features:
- **KYC Verification**: Users can upload National ID and a selfie for verification. Verified status increases trust and visibility.
- **Escrow System**: Secure payment flow utilizing **IntaSend Secure Payments** where funds are held by HudumaLink until the buyer confirms receipt.
- **Withdrawals (B2C Cash-Out)**: Users can instantly withdraw their escrow earnings directly to their Safaricom M-Pesa line or Bank Account via the integrated IntaSend Payouts engine (minimum withdrawal KES 100). Only standard network payment transaction charges apply.
- **Social Media Integration**: Added links for WhatsApp, Facebook, Instagram, TikTok, and X (formerly Twitter) in the footer.
- **AI Chatbot**: Implemented a floating AI Assistant powered by Google Gemini for site navigation and safety tips.
- **Social Sharing**: Built-in sharing functionality for listings via Web Share API (WhatsApp, Facebook, etc.) or direct link copying.
- **Messaging**: Real-time chat between buyers and sellers.
- **Notifications**: In-app alerts for new messages, order updates, and administrative actions.
- **Search & Filter**: Advanced search by category, keyword, and location (County/Town).

### Admin Features:
- **User Management**: Overview of all users and their verification status.
- **KYC Approval**: Interface to review and approve/reject user verification requests.
- **Dispute Resolution**: Ability to intervene in escrow disputes and refund buyers or release funds to sellers.
- **Withdrawal Processing**: Review and approve/reject payout requests.
- **Reporting**: Manage user reports and remove fraudulent listings.

---

## 5. Security & Trust

- **Verified Badges**: Visual indicators for KYC-verified users.
- **Escrow Protection**: Prevents "upfront payment" scams.
- **Dispute System**: Provides a safety net for both parties in a transaction.
- **Privacy First**: User PII (email, phone, KYC docs) is strictly protected via Firestore rules.

---

## 6. Development & Deployment

- **Build System**: Vite for fast development and optimized production builds.
- **Linting**: ESLint and TypeScript for code quality and type safety.
- **Infrastructure**: Hosted on Google Cloud Run for high availability and performance.
