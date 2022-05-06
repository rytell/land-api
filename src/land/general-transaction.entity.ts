import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('general-transactions')
export class GeneralTransaction extends BaseEntity {
    @Column({ nullable: false, unique: true })
    hash: string;

    @Column({ type: 'int', nullable: false })
    character: number;

    @Column({ nullable: true })
    staker: string;

    @Column({ type: 'float', nullable: false })
    value: number;

    @Column({ type: 'float', nullable: false, default: 0 })
    radiValue: number;

    @Column({ type: 'float', nullable: false, default: 0 })
    ironValue: number;

    @Column({ type: 'float', nullable: false, default: 0 })
    stoneValue: number;

    @Column({ type: 'float', nullable: false, default: 0 })
    woodValue: number;

    @Column({ type: 'float', nullable: false, default: 0 })
    wheatValue: number;

    @Column({ nullable: false })
    redeemed: boolean;

    @Column({ nullable: false })
    transactionType: string;
}
