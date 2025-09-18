# TODO: Implement IndexedDB Enhancements for Frontend Data Management

## Goal 1: Frontend Data Management (IndexedDB)

### 1. Enhance indexedDbService.ts
- [x] Add generateOptionsHash function (SHA-256 hash of quiz options)
- [x] Add checkQuizExists function (check if quiz with hash exists)
- [x] Add saveUiState and getUiState functions (for temporary UI data)
- [x] Add cleanupExpiredData function (TTL for cached quizzes)
- [x] Update DB_VERSION to 4 for new stores (uiState) - removed apiKeys as per user request

### 2. Update SettingsPopover.tsx
- [x] No changes needed - API key handling removed from plan

### 3. Update QuizCreator.tsx
- [ ] Add logic to check for existing quiz before generation
- [ ] Generate hash from current options and check IndexedDB
- [ ] If exists, load from IndexedDB instead of generating
- [ ] Save/load UI state (prompt, selectedFile, etc.) on component mount/unmount

### 4. Update types.ts
- [ ] Add types for ApiKeyData, UiStateData

### 5. Testing and Cleanup
- [ ] Test quiz caching functionality
- [ ] Test API key encryption/decryption
- [ ] Test UI state persistence
- [ ] Implement TTL cleanup on app initialization
