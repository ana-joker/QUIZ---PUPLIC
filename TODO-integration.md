# TODO List for Integration and Testing

- [x] Review updated User and AppSettings interfaces in types.ts
- [x] Confirm removal of apiKey from defaultSettings in App.tsx
- [x] Verify services/api.ts uses new backend URLs and includes deviceId/deviceName
- [x] Check LoginForm.tsx, RegisterForm.tsx, LoginWithCode.tsx for deviceId/deviceName usage and error handling
- [x] Validate quiz generation components use updated API endpoints and settings fields (numMCQs, numCases)
- [x] Review AdminDashboard.tsx, TeacherDashboard.tsx, ManageMaterials.tsx, CourseDetails.tsx, MyUsage.tsx, Dashboard.tsx for new User roles/plans and API usage
- [x] Confirm invite acceptance API call in LoginWithCode.tsx and context/AuthContext.tsx
- [x] Verify toast notification system integration and usage
- [ ] Perform thorough testing of:
  - Authentication flows (login, registration, login with code)
  - Quiz generation from text and course material
  - Course management and material upload
  - Admin dashboard user management, payments, site settings
  - Usage tracking and quota enforcement
  - Invite acceptance flow
- [ ] Address any bugs or issues found during testing
- [ ] Finalize and prepare for deployment

# Next Steps
- Proceed with thorough testing of all areas listed above for complete coverage.
- Report any issues or feedback for fixes and improvements.
