import { PartialType } from '@nestjs/mapped-types';
import { CreateLifecycleEventDto } from './create-lifecycle-event.dto';

export class UpdateLifecycleEventDto extends PartialType(CreateLifecycleEventDto) {}