import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('邮箱已被注册');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: 'user',
    });

    const saved = await this.userRepo.save(user);

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      role: saved.role,
      createdAt: saved.createdAt,
    };
  }
}
