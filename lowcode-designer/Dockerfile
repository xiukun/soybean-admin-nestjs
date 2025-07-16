# syntax=docker/dockerfile:1

# 轻量级 Dockerfile - 使用预编译的静态资源
# 避免在容器中编译，解决内存溢出问题

################################################################################
# 直接使用 Nginx 镜像作为基础镜像
FROM nginx:stable-alpine AS final

WORKDIR /usr/share/nginx/html

# 设置时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo 'Asia/Shanghai' >/etc/timezone \
    && rm /etc/nginx/nginx.conf

# 复制 Nginx 配置文件
COPY lowcode-designer/nginx.conf /etc/nginx/nginx.conf

# 复制预编译的静态资源（从项目根目录的 static-designer 目录）
COPY static-designer/ .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
