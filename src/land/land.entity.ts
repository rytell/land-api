import { Column, Entity, ManyToMany, JoinTable, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('lands')
export class Land extends BaseEntity {
    @Column({ type: 'int', nullable: false, unique: true })
    land_id: number;

    @Column({nullable: false })
    collection: string;

    @Column({ nullable: false })
    image: string;

    @Column({ nullable: false })
    name: string;

    @Column({ type: 'float', nullable: false })
    rarity: number;

    @Column({ nullable: false })
    character: string;

    @Column({ type: 'int', nullable: false })
    tier: number;

    @Column({ nullable: false })
    title: string;

    @Column({ type: 'int', nullable: false })
    strength: number;

    @Column({ nullable: false })
    background: string;

    @Column({ type: 'int', nullable: false })
    cunning: number;

    @Column({ type: 'int', nullable: false })
    will: number;

    @Column({ type: 'int', nullable: false, unique: true })
    hero_number: number;

    @Column({ nullable: false })
    staked: boolean;

    @Column({ nullable: true })
    staker: string;

    @Column({ nullable: true })
    lastClaim: string;

    @Column({ nullable: true })
    lastStaked: string;

    @Column({ nullable: true })
    lastUnstaked: string;
}
