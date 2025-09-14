# TODO: Activate Smart Quiz Generator Frontend (Version 1.0)

## Foundation & Consolidation (Priority) ✅ COMPLETED

### Auth Context Consolidation ✅
- [x] Delete context/AuthStore.tsx
- [x] Update services/api.ts to import useAuthStore from context/AuthContext.tsx
- [x] Update App.tsx to remove AuthStoreProvider wrapper
- [x] Update User type in types.ts: id instead of _id, role instead of type, plan includes 'guest'
- [x] Verify all files use useAuthStore from AuthContext.tsx

### Toast Context Consolidation ✅
- [x] Delete context/ToastContext.tsx
- [x] Update components/GenerateFromMaterialForm.tsx to import useToast from App.tsx
- [x] Verify all files use useToast from App.tsx

## API Key Management ✅
- [x] Remove apiKey from AppSettings in types.ts
- [x] Remove apiKey from defaultSettings in App.tsx
- [x] Remove GEMINI_API_KEY injection from vite.config.ts
- [x] Confirm VITE_BACKEND_API_URL usage in services/api.ts
- [x] Confirm BACKEND_URL usage in services/geminiService.ts

## Core Functionality Fixes ✅ MOSTLY COMPLETED

### Authentication & Registration ✅
- [x] Verify LoginForm.tsx uses AuthContext and deviceId
- [x] Verify RegisterForm.tsx uses AuthContext and deviceId
- [x] Verify LoginWithCode.tsx uses AuthContext and deviceId
- [x] Verify PrivateRoute.tsx uses AuthContext

### Quiz Generation Flow ✅
- [x] Fix GeneratePDF.tsx API call for "From Course Material" to /api/quiz/material
- [x] Verify QuizCreator.tsx quota and upload logic
- [x] Verify GenerateFromMaterialForm.tsx course/material selection

### Quiz Display & Interaction
- [x] Verify QuizFlow.tsx and QuizInterface.tsx iframe and postMessage
- [x] Verify QuestionDisplay.tsx for all question types
- [x] Verify QuizPage.tsx and ResultsPage.tsx

### History & Review
- [x] Verify HistoryPage.tsx getQuizzesFromIndexedDB
- [x] Verify ReviewPage.tsx and RecallPage.tsx

### Course Management
- [x] Verify JoinCourse.tsx, MyCourses.tsx, CourseDetails.tsx

### Dashboards
- [x] Verify Dashboard.tsx, StudentDashboard.tsx, TeacherDashboard.tsx, AdminDashboard.tsx

### Account Management
- [x] Verify SettingsPage.tsx, ManageDevices.tsx, MyUsage.tsx, Billing.tsx

## General Enhancements & Bug Fixes ✅ COMPLETED

### Utility Functions ✅
- [x] Create utils/deviceUtils.ts with getDeviceName function
- [x] Update LoginForm.tsx, RegisterForm.tsx, LoginWithCode.tsx to use new getDeviceName

### Code Quality & Linting ✅
- [x] Install and configure ESLint with TypeScript and React support
- [x] Install and configure Prettier for code formatting
- [x] Add lint and format scripts to package.json
- [x] Run linting and formatting on codebase
- [x] Move deviceUtils.ts from src/utils/ to utils/ and update imports
- [x] Remove unnecessary src folder

### Performance & Error Handling
- [x] Review useMemo/useCallback in large components
- [x] Ensure proper error/loading states
- [x] Update react-router-dom types if needed

## Testing & Verification
- [x] Test authentication flows
- [x] Test quiz generation from all sources
- [x] Test toast notifications
- [x] Test environment variables
- [x] Verify no runtime errors
- [x] Confirm UI behavior
