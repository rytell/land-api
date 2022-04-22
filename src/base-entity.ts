import { CreateDateColumn, PrimaryGeneratedColumn, Timestamp } from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @CreateDateColumn({ nullable: false })
  created_at: Date;
  @CreateDateColumn({ nullable: false })
  updated_at: Date;
}
