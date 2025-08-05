import { PartialType } from '@nestjs/swagger';
import { CreateAppSpaceDto } from './create-app-space.dto';

/**
 * 更新应用空间的数据传输对象
 * 继承自CreateAppSpaceDto，所有字段都是可选的
 */
export class UpdateAppSpaceDto extends PartialType(CreateAppSpaceDto) {}