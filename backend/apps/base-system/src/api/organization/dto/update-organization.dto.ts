import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

/**
 * 更新组织的数据传输对象
 * 继承自CreateOrganizationDto，所有字段都是可选的
 */
export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}