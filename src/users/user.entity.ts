import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  modified: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  last_login: Date;

  @Column()
  email: string;

  @Column()
  password: string;

  token: string;
}
