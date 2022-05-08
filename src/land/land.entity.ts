import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('lands')
@Unique(['land_id', 'collection'])
export class Land extends BaseEntity {
    @Column({ type: 'int', nullable: false })
    land_id: number;

    @Column({ nullable: false })
    collection: string;

    @Column({ nullable: false })
    image: string;

    @Column({ type: 'int', nullable: false })
    hero_number: number;

    @Column({ nullable: false })
    hero_type: string;

    @Column({ nullable: false })
    type: string;

    @Column({ nullable: false })
    resource_a: string;

    @Column({ nullable: false })
    resource_a_value: number;

    @Column({ nullable: false })
    resource_b: string;

    @Column({ nullable: false })
    resource_b_value: number;

    @Column({ nullable: true })
    staker: string;

    @Column({ nullable: true })
    lastClaim: string;
}
