import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { UsersService } from '../src/users/user.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { AuthController } from '../src/auth/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { JwtPayload } from '../src/auth/jwt-payload.interface';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let jwtPayload: JwtPayload;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'test',
          entities: [User],
          synchronize: true,
        }),
        JwtModule.register({
          secret: 'test-secret',
        }),
      ],
      providers: [UsersService, AuthService, JwtStrategy],
      controllers: [AuthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    authService = moduleFixture.get<AuthService>(AuthService);

    // Create a test user
    const user = await userRepository.create({
      email: 'test@example.com',
      password: 'password',
    });
    await userRepository.save(user);

    // Generate a JWT token for the test user
    jwtPayload = { email: user.email, password: user.password };
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return a JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should return a 401 unauthorized error if email is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'password',
        })
        .expect(401);

      expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('should return a 401 unauthorized error if password is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'invalid',
        })
        .expect(401);

      expect(response.body).toEqual({ message: 'Unauthorized' });
    });
  });

  describe('GET /users', () => {
    it('should return a 401 unauthorized error if no JWT token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(401);

      expect(response.body).toEqual({ message: 'Unauthorized' });
    });
  });
});
