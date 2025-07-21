model 用户 {
  // Field: 租户ID (tenantId) - Type: STRING - PrismaType: String?
  tenantId String?
  // Field: ID (id) - Type: UUID - PrismaType: String
  id String @default(cuid())
  // Field: 用户名 (username) - Type: STRING - PrismaType: String
  username String
  // Field: 邮箱 (email) - Type: STRING - PrismaType: String
  email String
  // Field: 密码 (password) - Type: STRING - PrismaType: String
  password String
  // Field: 昵称 (nickname) - Type: STRING - PrismaType: String?
  nickname String?
  // Field: 头像 (avatar) - Type: STRING - PrismaType: String?
  avatar String?
  // Field: 状态 (status) - Type: STRING - PrismaType: String
  status String
  // Field: 创建时间 (createdAt) - Type: DATETIME - PrismaType: DateTime
  createdAt DateTime @default(now())
  // Field: 更新时间 (updatedAt) - Type: DATETIME - PrismaType: DateTime
  updatedAt DateTime @default(now()) @updatedAt
  // Field: 创建人 (createdBy) - Type: STRING - PrismaType: String?
  createdBy String?
  // Field: 更新人 (updatedBy) - Type: STRING - PrismaType: String?
  updatedBy String?

  @@map("demo_users")
}