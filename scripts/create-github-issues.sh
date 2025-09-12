#!/bin/bash

# GitHub CLI commands to create user stories as issues
# Run this script from the project root directory
# Make sure you have GitHub CLI installed and authenticated: gh auth login

echo "🏊‍♂️ Creating GitHub issues for Sports Platform user stories..."
echo "Repository: $(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo ""

# Create labels first
echo "📋 Creating labels..."
gh label create "user-story" --description "User story for the platform" --color "0E8A16" --force
gh label create "coach" --description "Coach/Trainer user type" --color "1D76DB" --force
gh label create "admin" --description "Administrator user type" --color "D73A4A" --force
gh label create "athlete" --description "Athlete user type" --color "F9D0C4" --force
gh label create "medical" --description "Medical staff user type" --color "FBCA04" --force
gh label create "parent" --description "Parent user type" --color "7057FF" --force
gh label create "director" --description "Director user type" --color "006B75" --force
gh label create "mvp" --description "MVP scope feature" --color "B60205" --force
gh label create "training" --description "Training management module" --color "0052CC" --force
gh label create "communication" --description "Communication module" --color "5319E7" --force
gh label create "performance" --description "Performance tracking module" --color "C2E0C6" --force
gh label create "finance" --description "Financial management module" --color "FFEB3B" --force

echo "✅ Labels created successfully!"
echo ""

# 🏊‍♂️ COACH USER STORIES
echo "🏊‍♂️ Creating Coach user stories..."

gh issue create \
  --title "As a coach, I want to create weekly training schedules" \
  --body "**User Story**: As a coach, I want to create weekly training schedules so that athletes know when and what to train

**Acceptance Criteria**:
- [ ] Coach can create new training sessions for specific dates/times
- [ ] Coach can use session templates for quick creation
- [ ] Coach can assign specific athletes or groups to sessions
- [ ] Athletes receive notifications about assigned sessions
- [ ] Calendar view shows all scheduled sessions for the week
- [ ] Coach can duplicate sessions across multiple days

**Priority**: High (MVP Core Feature)
**Module**: Training Management
**Estimated Effort**: 8 story points" \
  --label "user-story,coach,training,mvp"

gh issue create \
  --title "As a coach, I want to use training session templates" \
  --body "**User Story**: As a coach, I want to use training session templates so that I can quickly create consistent workouts

**Acceptance Criteria**:
- [ ] Coach can create custom session templates
- [ ] Coach can save frequently used workout structures
- [ ] Templates include warm-up, main set, and cool-down sections
- [ ] Coach can modify templates without affecting existing sessions
- [ ] Templates can be categorized by training type (endurance, sprint, technique)
- [ ] Coach can share templates with other coaches in the club

**Priority**: Medium
**Module**: Training Management
**Estimated Effort**: 5 story points" \
  --label "user-story,coach,training"

gh issue create \
  --title "As a coach, I want to track attendance in real-time" \
  --body "**User Story**: As a coach, I want to track attendance in real-time so that I can monitor athlete commitment

**Acceptance Criteria**:
- [ ] Coach can mark athletes as present/absent during sessions
- [ ] Real-time attendance tracking with mobile support
- [ ] Attendance history is automatically saved
- [ ] Coach receives notifications about chronic absences
- [ ] Attendance reports can be generated for parents/administrators
- [ ] Quick attendance taking with athlete photos/cards

**Priority**: High (MVP Core Feature)
**Module**: Training Management
**Estimated Effort**: 6 story points" \
  --label "user-story,coach,training,mvp"

gh issue create \
  --title "As a coach, I want to record individual athlete performance" \
  --body "**User Story**: As a coach, I want to record individual athlete performance so that I can track progress over time

**Acceptance Criteria**:
- [ ] Coach can enter times, distances, and technique notes
- [ ] Performance data is linked to specific training sessions
- [ ] Coach can record multiple performance metrics per session
- [ ] Data validation ensures realistic performance entries
- [ ] Performance trends are automatically calculated
- [ ] Coach can add qualitative notes about athlete improvement

**Priority**: High (MVP Core Feature)
**Module**: Performance Tracking
**Estimated Effort**: 8 story points" \
  --label "user-story,coach,performance,mvp"

gh issue create \
  --title "As a coach, I want to view performance trends" \
  --body "**User Story**: As a coach, I want to view performance trends so that I can adjust training plans accordingly

**Acceptance Criteria**:
- [ ] Visual charts showing athlete performance over time
- [ ] Ability to compare current vs. previous performance
- [ ] Trend analysis with improvement/decline indicators
- [ ] Filtering by date ranges, events, or training types
- [ ] Export performance reports to PDF/Excel
- [ ] Predictive insights for upcoming competitions

**Priority**: Medium
**Module**: Performance Tracking
**Estimated Effort**: 10 story points" \
  --label "user-story,coach,performance"

gh issue create \
  --title "As a coach, I want to send targeted announcements" \
  --body "**User Story**: As a coach, I want to send announcements to specific groups so that communication is targeted and relevant

**Acceptance Criteria**:
- [ ] Coach can create announcements for specific groups/athletes
- [ ] Rich text editor with formatting options
- [ ] Schedule announcements for future delivery
- [ ] Track read receipts and engagement
- [ ] Push notifications and email integration
- [ ] Emergency announcement capability with high priority

**Priority**: High (MVP Core Feature)
**Module**: Communication
**Estimated Effort**: 6 story points" \
  --label "user-story,coach,communication,mvp"

# 🏢 ADMINISTRATOR USER STORIES
echo "🏢 Creating Administrator user stories..."

gh issue create \
  --title "As an administrator, I want to manage user accounts" \
  --body "**User Story**: As an administrator, I want to create and manage user accounts so that access control is maintained

**Acceptance Criteria**:
- [ ] Administrator can create new user accounts
- [ ] Assign appropriate roles and permissions to users
- [ ] Bulk user import from CSV/Excel files
- [ ] Deactivate/reactivate user accounts as needed
- [ ] Password reset functionality for users
- [ ] User activity monitoring and audit logs

**Priority**: High (MVP Core Feature)
**Module**: User Management
**Estimated Effort**: 8 story points" \
  --label "user-story,admin,mvp"

gh issue create \
  --title "As an administrator, I want to manage membership billing" \
  --body "**User Story**: As an administrator, I want to manage membership billing so that the club maintains financial stability

**Acceptance Criteria**:
- [ ] Create and manage membership fee structures
- [ ] Generate monthly bills automatically
- [ ] Track payment status and overdue accounts
- [ ] Send payment reminders via email/SMS
- [ ] Generate financial reports and summaries
- [ ] Handle payment plans and discounts

**Priority**: Medium
**Module**: Financial Management
**Estimated Effort**: 12 story points" \
  --label "user-story,admin,finance"

gh issue create \
  --title "As an administrator, I want to configure club settings" \
  --body "**User Story**: As an administrator, I want to configure club settings so that the platform reflects our operational needs

**Acceptance Criteria**:
- [ ] Configure club information and branding
- [ ] Set up training schedules and facility hours
- [ ] Manage fee structures and payment options
- [ ] Configure notification preferences and templates
- [ ] Set up data backup and retention policies
- [ ] Customize user interface and terminology

**Priority**: Medium (MVP Core Feature)
**Module**: Club Management
**Estimated Effort**: 6 story points" \
  --label "user-story,admin,mvp"

# 🏊 ATHLETE USER STORIES
echo "🏊 Creating Athlete user stories..."

gh issue create \
  --title "As an athlete, I want to view my training schedule" \
  --body "**User Story**: As an athlete, I want to view my training schedule so that I can plan my week accordingly

**Acceptance Criteria**:
- [ ] Athlete can view weekly/monthly training calendar
- [ ] Training sessions show time, location, and type
- [ ] Color-coded sessions by training type or coach
- [ ] Sync with device calendar (Google, Apple)
- [ ] Receive reminders before training sessions
- [ ] View session details and requirements

**Priority**: High (MVP Core Feature)
**Module**: Training Management
**Estimated Effort**: 5 story points" \
  --label "user-story,athlete,training,mvp"

gh issue create \
  --title "As an athlete, I want to track my personal records" \
  --body "**User Story**: As an athlete, I want to track my personal records so that I can monitor my improvement

**Acceptance Criteria**:
- [ ] View personal best times for different events
- [ ] See improvement trends over time
- [ ] Compare current performance with historical data
- [ ] Set personal goals and track progress
- [ ] Celebrate achievements and milestones
- [ ] Share achievements with coaches and parents

**Priority**: Medium
**Module**: Performance Tracking
**Estimated Effort**: 6 story points" \
  --label "user-story,athlete,performance"

gh issue create \
  --title "As an athlete, I want to receive training reminders" \
  --body "**User Story**: As an athlete, I want to receive training reminders so that I don't miss sessions

**Acceptance Criteria**:
- [ ] Receive push notifications for upcoming sessions
- [ ] Configurable reminder timing (1 hour, 2 hours before)
- [ ] Email reminders as backup
- [ ] Emergency notifications for schedule changes
- [ ] Customizable notification preferences
- [ ] Reminder includes session details and requirements

**Priority**: High (MVP Core Feature)
**Module**: Communication
**Estimated Effort**: 4 story points" \
  --label "user-story,athlete,communication,mvp"

# 🏥 MEDICAL STAFF USER STORIES
echo "🏥 Creating Medical staff user stories..."

gh issue create \
  --title "As medical staff, I want to access athlete medical records" \
  --body "**User Story**: As medical staff, I want to access athlete medical records so that I can provide appropriate care

**Acceptance Criteria**:
- [ ] Secure access to assigned athlete medical information
- [ ] View medical history, allergies, and current medications
- [ ] HIPAA-compliant data handling and access logs
- [ ] Emergency contact information readily available
- [ ] Medical restrictions and clearance status
- [ ] Integration with external healthcare systems

**Priority**: Medium
**Module**: Medical Management
**Estimated Effort**: 10 story points" \
  --label "user-story,medical"

gh issue create \
  --title "As medical staff, I want to track injuries and treatments" \
  --body "**User Story**: As medical staff, I want to track injuries and treatments so that recovery is properly managed

**Acceptance Criteria**:
- [ ] Document injury incidents with detailed information
- [ ] Track treatment progress and recovery milestones
- [ ] Set training restrictions based on medical conditions
- [ ] Generate medical clearance certificates
- [ ] Monitor rehabilitation exercises and compliance
- [ ] Injury prevention recommendations

**Priority**: Medium
**Module**: Medical Management
**Estimated Effort**: 8 story points" \
  --label "user-story,medical"

# 👨‍👩‍👧‍👦 PARENT USER STORIES
echo "👨‍👩‍👧‍👦 Creating Parent user stories..."

gh issue create \
  --title "As a parent, I want to view my child's training schedule" \
  --body "**User Story**: As a parent, I want to view my child's training schedule so that I can coordinate transportation

**Acceptance Criteria**:
- [ ] View child's weekly training calendar
- [ ] Receive notifications about schedule changes
- [ ] See training location and duration
- [ ] Calendar integration for family planning
- [ ] Multiple children support for families
- [ ] Emergency contact and pickup arrangements

**Priority**: High (MVP Core Feature)
**Module**: Training Management
**Estimated Effort**: 4 story points" \
  --label "user-story,parent,training,mvp"

gh issue create \
  --title "As a parent, I want to receive progress updates" \
  --body "**User Story**: As a parent, I want to receive progress updates so that I can support my child's development

**Acceptance Criteria**:
- [ ] Regular progress reports via email
- [ ] View child's attendance and performance trends
- [ ] Celebration of achievements and milestones
- [ ] Coach feedback and development recommendations
- [ ] Goal setting and progress tracking
- [ ] Communication channel with coaches

**Priority**: Medium
**Module**: Communication
**Estimated Effort**: 6 story points" \
  --label "user-story,parent,communication"

gh issue create \
  --title "As a parent, I want to manage payment information" \
  --body "**User Story**: As a parent, I want to manage payment information so that fees are paid on time

**Acceptance Criteria**:
- [ ] View current and past invoices
- [ ] Manage payment methods and billing information
- [ ] Receive payment reminders and due date notifications
- [ ] Access receipts and payment history
- [ ] Set up automatic payment options
- [ ] Handle payment plans and financial assistance

**Priority**: Medium
**Module**: Financial Management
**Estimated Effort**: 8 story points" \
  --label "user-story,parent,finance"

# 📈 DIRECTOR USER STORIES
echo "📈 Creating Director user stories..."

gh issue create \
  --title "As a director, I want to view club performance metrics" \
  --body "**User Story**: As a director, I want to view club performance metrics so that I can assess overall health

**Acceptance Criteria**:
- [ ] Executive dashboard with key performance indicators
- [ ] Member retention and growth metrics
- [ ] Financial performance summaries
- [ ] Athlete performance and competition results
- [ ] Coach effectiveness and satisfaction metrics
- [ ] Facility utilization and capacity analysis

**Priority**: Low
**Module**: Analytics & Reporting
**Estimated Effort**: 12 story points" \
  --label "user-story,director"

gh issue create \
  --title "As a director, I want to analyze growth trends" \
  --body "**User Story**: As a director, I want to analyze growth trends so that I can plan for expansion

**Acceptance Criteria**:
- [ ] Historical growth analysis and projections
- [ ] Seasonal trends and patterns identification
- [ ] Competitive analysis and market positioning
- [ ] Revenue forecasting and budget planning
- [ ] Capacity planning for facilities and staff
- [ ] Strategic planning tools and recommendations

**Priority**: Low
**Module**: Analytics & Reporting
**Estimated Effort**: 10 story points" \
  --label "user-story,director"

echo ""
echo "✅ All GitHub issues created successfully!"
echo ""
echo "📊 Summary:"
echo "- Coach stories: 6 issues"
echo "- Administrator stories: 3 issues"
echo "- Athlete stories: 3 issues"
echo "- Medical staff stories: 2 issues"
echo "- Parent stories: 3 issues"
echo "- Director stories: 2 issues"
echo ""
echo "Total: 19 user story issues created"
echo ""
echo "🔗 View all issues: gh issue list --label user-story"
echo "🏊‍♂️ View MVP issues: gh issue list --label mvp"
echo "🎯 View by user type: gh issue list --label coach"