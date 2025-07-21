"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("@decorators/public.decorator");
const prisma_service_1 = require("@lib/shared/prisma/prisma.service");
const amis_response_decorator_1 = require("@decorators/amis-response.decorator");
const amis_response_interceptor_1 = require("@interceptors/amis-response.interceptor");
let CodeGenerationController = class CodeGenerationController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTemplates(type, language, framework) {
        const where = {
            status: 'ACTIVE',
        };
        if (type) {
            where.type = type;
        }
        if (language) {
            where.language = language;
        }
        if (framework) {
            where.framework = framework;
        }
        const templates = await this.prisma.codeTemplate.findMany({
            where,
            select: {
                id: true,
                name: true,
                code: true,
                type: true,
                language: true,
                framework: true,
                description: true,
                variables: true,
                version: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: [
                { type: 'asc' },
                { name: 'asc' },
            ],
        });
        return templates.map(template => ({
            ...template,
            variables: typeof template.variables === 'string'
                ? JSON.parse(template.variables)
                : template.variables,
        }));
    }
};
exports.CodeGenerationController = CodeGenerationController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, amis_response_decorator_1.AmisResponse)({
        description: 'Get available code templates',
        dataKey: 'templates'
    }),
    (0, swagger_1.ApiOperation)({ summary: 'Get available code templates' }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('language')),
    __param(2, (0, common_1.Query)('framework')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CodeGenerationController.prototype, "getTemplates", null);
exports.CodeGenerationController = CodeGenerationController = __decorate([
    (0, swagger_1.ApiTags)('code-generation'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, public_decorator_1.Public)() // 临时禁用认证以便测试
    ,
    (0, common_1.Controller)({ path: 'code-generation', version: '1' }),
    (0, common_1.UseInterceptors)(amis_response_interceptor_1.AmisResponseInterceptor),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], CodeGenerationController);
