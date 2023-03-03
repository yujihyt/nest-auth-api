import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(user: User): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = { ...user, password: hashedPassword };
    await this.usersService.create(newUser);
    const payload = { email: newUser.email, sub: newUser.id };
    const token = this.jwtService.sign(payload);
    return { ...newUser, token };
  }

  async signIn(user: User): Promise<User> {
    const foundUser = await this.usersService.findOneByEmail(user.email);
    if (!foundUser) {
      throw new Error('Invalid credentials');
    }
    const isPasswordMatch = await bcrypt.compare(
      user.password,
      foundUser.password,
    );
    if (!isPasswordMatch) {
      throw new Error('Invalid credentials');
    }
    const payload = { email: foundUser.email, sub: foundUser.id };
    const token = this.jwtService.sign(payload);
    return { ...foundUser, token };
  }
}
