import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entity representing a geographic territory for insurance operations
 * @class Territory
 * @entity territories
 */
@Entity('territories')
@Index(['code'], { unique: true })
@Index(['type'])
@Index(['parentTerritoryId'])
export class Territory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: ['zipcode', 'city', 'county', 'state', 'region'],
  })
  type: 'zipcode' | 'city' | 'county' | 'state' | 'region';

  @Column({ name: 'parent_territory_id', nullable: true })
  parentTerritoryId: string;

  @ManyToOne(() => Territory)
  @JoinColumn({ name: 'parent_territory_id' })
  parentTerritory: Territory;

  @Column({ type: 'jsonb', nullable: true })
  boundaries: any; // GeoJSON data

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}