import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';

/**
 * 更新租户的数据传输对象
 * 继承自CreateTenantDto，所有字段都是可选的
 */
export class UpdateTenantDto extends PartialType(CreateTenantDto) {}