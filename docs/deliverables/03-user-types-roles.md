# 👥 User Types and Specific Roles

## 1. 🏊‍♂️ Entrenadores (Primary Users)

### Permissions & Access

- **Full Training Management**: Create, modify, and delete training sessions
- **Athlete Performance Tracking**: Access to all athlete data and performance metrics
- **Session Planning**: Advanced calendar management and training program design
- **Communication Tools**: Send announcements, messages, and notifications
- **Progress Monitoring**: View and update athlete development data

### Core Responsibilities

- Daily training session management
- Athlete performance evaluation and feedback
- Training program development and adjustment
- Parent and athlete communication
- Competition preparation and strategy

### Access Level

- Club-wide athlete data access
- Training history and performance analytics
- Competition results and rankings
- Medical information (with restrictions)
- Communication with all stakeholders

## 2. 🏢 Administradores de Club

### Permissions & Access

- **Financial Management**: Complete billing, payment, and financial reporting
- **User Administration**: Create, modify, and deactivate user accounts
- **Club Settings**: System configuration and customization
- **Advanced Reports**: Access to all administrative and financial reports
- **Facility Management**: Pool scheduling and resource allocation

### Core Responsibilities

- Membership management and billing
- Staff and user account administration
- Financial oversight and reporting
- System configuration and maintenance
- Facility and resource coordination

### Access Level

- Full club operational data
- Financial records and billing information
- User management and permissions
- System settings and configuration
- Administrative reports and analytics

## 3. 🏊 Atletas/Deportistas

### Permissions & Access

- **Personal Profile Management**: Update contact info and personal details
- **Training Schedule Access**: View assigned training sessions and calendar
- **Performance Tracking**: Access to personal records and progress data
- **Goal Setting**: Create and track personal objectives
- **Communication**: Message coaches and receive announcements

### Core Responsibilities

- Maintain updated personal information
- Attend scheduled training sessions
- Track personal progress and goals
- Communicate with coaches about concerns or issues
- Follow club rules and training guidelines

### Access Level

- Personal data and performance metrics only
- Assigned training sessions and calendar
- Individual progress reports and analytics
- Club announcements and general information
- Direct communication with assigned coaches

## 4. 🏥 Personal Médico

### Permissions & Access

- **Medical Records Access**: View and update athlete health information
- **Health Assessments**: Conduct and record fitness evaluations
- **Injury Management**: Track injuries, treatments, and recovery
- **Medical Clearances**: Approve or restrict athlete participation
- **Health Reports**: Generate medical summaries and recommendations

### Core Responsibilities

- Regular health monitoring and assessments
- Injury prevention and treatment guidance
- Medical clearance for training and competition
- Health education and recommendations
- Emergency medical response coordination

### Access Level

- Medical data for assigned athletes
- Health and fitness assessment tools
- Injury tracking and treatment records
- Medical clearance and restriction management
- Health-related reports and analytics

## 5. 👨‍👩‍👧‍👦 Padres de Familia

### Permissions & Access

- **Child Information Access**: View child's profile, schedule, and progress
- **Communication Tools**: Message coaches and receive notifications
- **Payment Management**: View bills, make payments, and track expenses
- **Progress Monitoring**: Access to child's performance reports
- **Emergency Updates**: Receive urgent notifications and alerts

### Core Responsibilities

- Support child's athletic development
- Maintain updated contact and emergency information
- Ensure timely payment of fees and expenses
- Communicate with coaches about child's needs
- Transportation and logistics coordination

### Access Level

- Limited to child's information only
- Training schedules and attendance records
- Progress reports and performance updates
- Financial information related to child's membership
- Club announcements and important communications

## 6. 📈 Directivos

### Permissions & Access

- **Executive Dashboards**: High-level performance and operational metrics
- **Strategic Reports**: Club growth, performance, and financial analysis
- **Club Analytics**: Member retention, satisfaction, and engagement data
- **Performance Oversight**: Coach and program effectiveness metrics
- **Growth Planning**: Expansion and development planning tools

### Core Responsibilities

- Strategic planning and club direction
- Performance oversight and evaluation
- Growth and expansion planning
- Stakeholder communication and reporting
- Policy development and implementation

### Access Level

- High-level analytics and KPIs
- Financial summaries and projections
- Club performance metrics
- Strategic planning tools and data
- Executive reports and dashboards

## Role Hierarchy and Permissions Matrix

| Function            | Entrenador      | Admin    | Atleta       | Médico          | Padre            | Directivo    |
| ------------------- | --------------- | -------- | ------------ | --------------- | ---------------- | ------------ |
| Training Management | ✅ Full         | ❌       | 👁️ View Own  | ❌              | 👁️ View Child    | 📊 Reports   |
| Athlete Data        | ✅ All Athletes | ✅ All   | 👁️ Own Only  | 🏥 Medical Only | 👁️ Child Only    | 📊 Analytics |
| Financial           | ❌              | ✅ Full  | 👁️ Own Bills | ❌              | 💳 Child Bills   | 📊 Reports   |
| Communication       | 📢 Send All     | 📢 Admin | 📨 Receive   | 📨 Medical      | 📨 Child Related | 📊 Overview  |
| Medical Records     | 👁️ Basic Info   | ❌       | 👁️ Own       | ✅ Full Access  | 👁️ Child Only    | ❌           |
| Reports             | 📊 Training     | 📊 All   | 📊 Personal  | 📊 Medical      | 📊 Child         | 📊 Executive |

**Legend**: ✅ Full Access | 👁️ View Only | 📢 Send Permissions | 📨 Receive Only | 📊 Reports | ❌ No Access | 💳 Payment Only | 🏥 Medical Scope
