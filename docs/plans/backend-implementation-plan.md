# Backend Implementation Plan

## Overview
Добавление бэкенда на Node.js с авторизацией через Telegram и переносом логики подсчета калорий с фронтенда на бэкенд.

## 1. Backend Architecture

### 1.1 Technology Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js или Fastify
- **Database**: PostgreSQL с Prisma ORM
- **Authentication**: JWT + Telegram Web App API
- **Validation**: Zod или Joi
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI
- **Environment**: Docker + Docker Compose

### 1.2 Project Structure
```
backend/
├── src/
│   ├── controllers/          # HTTP controllers
│   ├── services/            # Business logic
│   ├── models/              # Database models (Prisma)
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   ├── config/              # Configuration
│   └── app.ts               # Application entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── tests/                   # Test files
├── docker/                  # Docker configuration
├── docs/                    # API documentation
└── package.json
```

## 2. Database Schema

### 2.1 User Model
```prisma
model User {
  id          String   @id @default(cuid())
  telegramId  String   @unique
  username    String?
  firstName   String?
  lastName    String?
  phoneNumber String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  calorieCalculations CalorieCalculation[]
  workouts           Workout[]
  
  @@map("users")
}
```

### 2.2 Calorie Calculation Model
```prisma
model CalorieCalculation {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Basic data
  age         Int
  gender      String
  height      Float
  weight      Float
  
  // Activity and goals
  activityLevel String
  goal         String
  
  // Results
  bmr          Float
  tdee         Float
  calorieGoal  Float
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("calorie_calculations")
}
```

### 2.3 Workout Model
```prisma
model Workout {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name        String
  description String?
  duration    Int?     // in minutes
  date        DateTime
  completed   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("workouts")
}
```

## 3. Authentication System

### 3.1 Telegram Web App Authentication
```typescript
// Telegram Web App validation
interface TelegramWebAppData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// JWT payload
interface JWTPayload {
  userId: string;
  telegramId: string;
  iat: number;
  exp: number;
}
```

### 3.2 Phone Number Authentication (Alternative)
```typescript
// Phone verification flow
interface PhoneVerification {
  phoneNumber: string;
  verificationCode: string;
  expiresAt: Date;
}

// SMS service integration
interface SMSService {
  sendVerificationCode(phoneNumber: string): Promise<void>;
  verifyCode(phoneNumber: string, code: string): Promise<boolean>;
}
```

### 3.3 Authentication Flow
1. **Telegram Web App**:
   - Получение данных от Telegram Web App API
   - Валидация подписи данных
   - Создание/поиск пользователя в БД
   - Генерация JWT токена

2. **Phone Number** (fallback):
   - Отправка SMS с кодом подтверждения
   - Верификация кода
   - Создание/поиск пользователя
   - Генерация JWT токена

## 4. API Endpoints

### 4.1 Authentication Routes
```typescript
POST /api/auth/telegram
POST /api/auth/phone/send-code
POST /api/auth/phone/verify
POST /api/auth/refresh
POST /api/auth/logout
```

### 4.2 User Routes
```typescript
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account
```

### 4.3 Calorie Calculation Routes
```typescript
POST   /api/calorie-calculations
GET    /api/calorie-calculations
GET    /api/calorie-calculations/:id
PUT    /api/calorie-calculations/:id
DELETE /api/calorie-calculations/:id
```

### 4.4 Workout Routes
```typescript
GET    /api/workouts
POST   /api/workouts
GET    /api/workouts/:id
PUT    /api/workouts/:id
DELETE /api/workouts/:id
```

## 5. Services Implementation

### 5.1 Calorie Calculation Service
```typescript
class CalorieCalculationService {
  // Перенос логики с фронтенда
  calculateBMR(age: number, gender: string, height: number, weight: number): number;
  calculateTDEE(bmr: number, activityLevel: string): number;
  calculateCalorieGoal(tdee: number, goal: string): number;
  
  // CRUD operations
  createCalculation(userId: string, data: CalorieCalculationInput): Promise<CalorieCalculation>;
  getUserCalculations(userId: string): Promise<CalorieCalculation[]>;
  updateCalculation(id: string, data: Partial<CalorieCalculationInput>): Promise<CalorieCalculation>;
  deleteCalculation(id: string): Promise<void>;
}
```

### 5.2 Authentication Service
```typescript
class AuthService {
  // Telegram authentication
  validateTelegramData(data: TelegramWebAppData): Promise<boolean>;
  authenticateTelegramUser(data: TelegramWebAppData): Promise<{ user: User; token: string }>;
  
  // Phone authentication
  sendVerificationCode(phoneNumber: string): Promise<void>;
  verifyPhoneCode(phoneNumber: string, code: string): Promise<{ user: User; token: string }>;
  
  // JWT management
  generateToken(user: User): string;
  verifyToken(token: string): JWTPayload;
  refreshToken(refreshToken: string): string;
}
```

### 5.3 User Service
```typescript
class UserService {
  createUser(data: CreateUserInput): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByTelegramId(telegramId: string): Promise<User | null>;
  updateUser(id: string, data: UpdateUserInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
```

## 6. Middleware

### 6.1 Authentication Middleware
```typescript
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};
```

### 6.2 Validation Middleware
```typescript
const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Validation failed', details: error });
    }
  };
};
```

### 6.3 Error Handling Middleware
```typescript
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(error);
  
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: 'Validation error', details: error.message });
  }
  
  if (error instanceof AuthenticationError) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};
```

## 7. Frontend Integration

### 7.1 API Service
```typescript
// src/shared/services/api/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}
  
  // Authentication
  authenticateWithTelegram(telegramData: TelegramWebAppData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/telegram`, telegramData);
  }
  
  // Calorie calculations
  createCalorieCalculation(data: CalorieCalculationInput): Observable<CalorieCalculation> {
    return this.http.post<CalorieCalculation>(`${this.baseUrl}/calorie-calculations`, data);
  }
  
  getUserCalorieCalculations(): Observable<CalorieCalculation[]> {
    return this.http.get<CalorieCalculation[]>(`${this.baseUrl}/calorie-calculations`);
  }
}
```

### 7.2 Authentication Service Update
```typescript
// src/shared/services/auth/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<User | null>(null);
  private readonly isAuthenticatedSignal = computed(() => !!this.userSignal());
  
  constructor(private apiService: ApiService, private telegramService: TelegramService) {}
  
  async authenticateWithTelegram(): Promise<void> {
    const telegramData = this.telegramService.getWebAppData();
    const response = await firstValueFrom(this.apiService.authenticateWithTelegram(telegramData));
    
    localStorage.setItem('auth_token', response.token);
    this.userSignal.set(response.user);
  }
  
  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    this.userSignal.set(null);
  }
}
```

### 7.3 Calorie Calculation Service Update
```typescript
// src/features/calorie-calculation/services/calorie-calculator.service.ts
@Injectable({ providedIn: 'root' })
export class CalorieCalculatorService {
  constructor(private apiService: ApiService) {}
  
  // Удаляем локальную логику расчета, используем API
  async calculateCalories(data: CalorieCalculationInput): Promise<CalorieCalculation> {
    return firstValueFrom(this.apiService.createCalorieCalculation(data));
  }
  
  async getUserCalculations(): Promise<CalorieCalculation[]> {
    return firstValueFrom(this.apiService.getUserCalorieCalculations());
  }
}
```

## 8. Environment Configuration

### 8.1 Backend Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/strive_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Telegram
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# SMS Service (if using phone auth)
SMS_API_KEY="your-sms-service-api-key"
SMS_API_URL="https://api.sms-service.com"

# Server
PORT=3000
NODE_ENV="development"
```

### 8.2 Frontend Environment Variables
```env
# API
API_URL="http://localhost:3000/api"
API_TIMEOUT=10000

# Telegram
TELEGRAM_BOT_USERNAME="your_bot_username"
```

## 9. Testing Strategy

### 9.1 Backend Tests
```typescript
// Unit tests for services
describe('CalorieCalculationService', () => {
  it('should calculate BMR correctly', () => {
    // Test BMR calculation logic
  });
  
  it('should create calorie calculation', async () => {
    // Test database operations
  });
});

// Integration tests for API endpoints
describe('POST /api/calorie-calculations', () => {
  it('should create calorie calculation with valid data', async () => {
    // Test API endpoint
  });
  
  it('should return 401 without authentication', async () => {
    // Test authentication middleware
  });
});
```

### 9.2 Frontend Tests
```typescript
// Update existing tests to mock API calls
describe('CalorieCalculatorService', () => {
  it('should call API service for calorie calculation', () => {
    // Mock API service and verify calls
  });
});
```

## 10. Deployment

### 10.1 Deployment Architecture

**GitHub Pages Limitations:**
- GitHub Pages поддерживает только статические сайты (HTML, CSS, JavaScript)
- Не поддерживает серверные языки (Node.js, Python, PHP)
- Нет поддержки баз данных
- Нет возможности запускать серверные процессы

**Рекомендуемая архитектура:**
```
Frontend (Angular) → GitHub Pages
Backend (Node.js)  → Vercel/Railway
Database (PostgreSQL) → Vercel Postgres/Railway Postgres
```

### 10.2 Backend Deployment Options

#### 10.2.1 Vercel (Рекомендуется)
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.ts"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "TELEGRAM_BOT_TOKEN": "@telegram_bot_token"
  }
}
```

**Преимущества Vercel:**
- Бесплатный план для небольших проектов
- Отличная поддержка Node.js
- Автоматический деплой из GitHub
- Встроенная поддержка PostgreSQL
- Edge functions для лучшей производительности
- Автоматические HTTPS сертификаты

#### 10.2.2 Railway
```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Преимущества Railway:**
- Простой деплой Node.js приложений
- Встроенная поддержка PostgreSQL
- Автоматический деплой из GitHub
- Бесплатный план доступен
- Простая настройка переменных окружения

#### 10.2.3 Render
```yaml
# render.yaml
services:
  - type: web
    name: strive-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: strive-db
          property: connectionString
```

**Преимущества Render:**
- Бесплатный план для Node.js
- Поддержка PostgreSQL
- Автоматический деплой
- Простая настройка

### 10.3 Database Deployment

#### 10.3.1 Vercel Postgres
```typescript
// Database connection for Vercel
import { sql } from '@vercel/postgres';

export async function getUsers(): Promise<User[]> {
  const { rows } = await sql`SELECT * FROM users`;
  return rows;
}
```

#### 10.3.2 Railway Postgres
```typescript
// Database connection for Railway
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### 10.4 Environment Configuration

#### 10.4.1 Vercel Environment Variables
```bash
# Vercel CLI
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add TELEGRAM_BOT_TOKEN
vercel env add SMS_API_KEY
```

#### 10.4.2 Railway Environment Variables
```bash
# Railway CLI
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-secret"
railway variables set TELEGRAM_BOT_TOKEN="your-token"
```

### 10.5 CI/CD Pipeline

#### 10.5.1 GitHub Actions for Backend
```yaml
# .github/workflows/backend-deploy.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./backend
```

#### 10.5.2 Frontend Deployment (GitHub Pages)
```yaml
# .github/workflows/frontend-deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths: ['src/**', 'angular.json', 'package.json']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --watch=false --browsers=ChromeHeadless
      
      - name: Build
        run: npm run build:github
        env:
          API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/strive
```

### 10.6 Docker Configuration (для локальной разработки)

#### 10.6.1 Dockerfile
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 10.6.2 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/strive_db
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=strive_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 10.7 Monitoring & Health Checks

#### 10.7.1 Health Check Endpoint
```typescript
// Health check for deployment platforms
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});
```

#### 10.7.2 Uptime Monitoring
```typescript
// Uptime monitoring setup
import { createClient } from '@vercel/analytics';

// Track API usage
app.use((req, res, next) => {
  // Log API calls for monitoring
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});
```

### 10.8 Domain Configuration

#### 10.8.1 Custom Domain Setup
```typescript
// CORS configuration for custom domain
const corsOptions = {
  origin: [
    'https://yourusername.github.io',
    'https://your-custom-domain.com',
    'https://strive-app.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

#### 10.8.2 SSL/HTTPS Configuration
- Vercel: Автоматические SSL сертификаты
- Railway: Автоматические SSL сертификаты
- Render: Автоматические SSL сертификаты
- GitHub Pages: Автоматические SSL сертификаты

## 11. Implementation Phases

### Phase 1: Backend Foundation (Week 1-2)
- [ ] Настройка Node.js проекта с Express
- [ ] Настройка PostgreSQL + Prisma
- [ ] Создание базовой структуры проекта
- [ ] Настройка Docker окружения
- [ ] Создание базовых моделей данных

### Phase 2: Authentication System (Week 3)
- [ ] Реализация Telegram Web App аутентификации
- [ ] Реализация JWT токенов
- [ ] Создание middleware для аутентификации
- [ ] Тестирование аутентификации

### Phase 3: Calorie Calculation API (Week 4)
- [ ] Перенос логики расчета калорий на бэкенд
- [ ] Создание API endpoints для калорий
- [ ] Интеграция с базой данных
- [ ] Тестирование API

### Phase 4: Frontend Integration (Week 5)
- [ ] Создание API service на фронтенде
- [ ] Обновление существующих сервисов
- [ ] Интеграция аутентификации
- [ ] Обновление тестов

### Phase 5: Phone Authentication (Week 6)
- [ ] Исследование SMS сервисов
- [ ] Реализация phone authentication
- [ ] Создание fallback механизма
- [ ] Тестирование phone auth

### Phase 6: Testing & Deployment (Week 7-8)
- [ ] Написание comprehensive тестов
- [ ] Настройка CI/CD
- [ ] Деплой на production
- [ ] Мониторинг и логирование

## 12. Security Considerations

### 12.1 Data Protection
- Шифрование чувствительных данных в БД
- Валидация всех входящих данных
- Rate limiting для API endpoints
- CORS настройки

### 12.2 Authentication Security
- Secure JWT secret management
- Token expiration and refresh
- Telegram data signature validation
- Phone number verification

### 12.3 API Security
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- HTTPS enforcement

## 13. Monitoring & Logging

### 13.1 Logging
```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### 13.2 Health Checks
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected', // Check DB connection
  });
});
```

## 14. Documentation

### 14.1 API Documentation
- Swagger/OpenAPI specification
- Postman collection
- API usage examples
- Authentication guide

### 14.2 Development Documentation
- Setup instructions
- Database schema documentation
- Deployment guide
- Contributing guidelines

## 15. Future Enhancements

### 15.1 Advanced Features
- Real-time notifications via WebSocket
- File upload for workout images
- Social features (sharing workouts)
- Advanced analytics and reporting

### 15.2 Performance Optimizations
- Redis caching
- Database query optimization
- CDN for static assets
- API response compression

### 15.3 Mobile App Support
- RESTful API ready for mobile apps
- Push notifications
- Offline data synchronization
- Mobile-specific endpoints

## Conclusion

Этот план обеспечивает пошаговую реализацию бэкенда с современной архитектурой, безопасной аутентификацией и масштабируемым дизайном. Фокус на Telegram Web App интеграции и переносе бизнес-логики на сервер обеспечит лучшую производительность и безопасность приложения.
