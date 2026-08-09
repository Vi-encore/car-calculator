import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, UserSchema } from '@car-calculator/types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  // 1. Створи constructor() і "впорсни" (inject) туди PrismaService
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: RegisterDto) {
    // 2. Знайди юзера в базі за dto.email (використовуй this.prisma.user.findUnique)
    const isExist = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });
    // 3. Якщо юзер вже існує — викинь помилку:
    // throw new ConflictException('Користувач з таким email вже існує');
    if (isExist)
      throw new ConflictException('Користувач з таким email вже існує');

    // 4. Захешуй пароль з dto.password за допомогою bcrypt.hash (використай 12 раундів)
    const hashed = (await bcrypt.hash(dto.password, 12)) as string;
    // 5. Створи нового юзера в базі (this.prisma.user.create),
    // передавши йому email, name (з dto) та свій новий захешований пароль
    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: hashed,
        // provider is by default: local? in a prisma scheme
      },
    });
    // 6. Поверни створеного юзера через return
    return UserSchema.parse(user);
  }
}
