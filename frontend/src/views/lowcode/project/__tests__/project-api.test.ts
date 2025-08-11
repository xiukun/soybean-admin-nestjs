import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject, deleteProject, getProjects, updateProject } from '../../../service/api/lowcode-project';

// Mock HTTP 客户端
vi.mock('../../../service/request', () => ({
  request: vi.fn()
}));

describe('Project API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('应该正确获取项目列表', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            name: '测试项目',
            code: 'test-project',
            status: 'ACTIVE'
          }
        ],
        total: 1
      };

      const { request } = await import('../../../service/request');
      vi.mocked(request).mockResolvedValue(mockResponse);

      const result = await getProjects();

      expect(request).toHaveBeenCalledWith({
        url: '/lowcode/projects',
        method: 'GET'
      });
      expect(result).toEqual(mockResponse);
    });

    it('应该正确处理分页参数', async () => {
      const { request } = await import('../../../service/request');
      vi.mocked(request).mockResolvedValue({ data: [], total: 0 });

      await getProjects({ page: 2, pageSize: 10 });

      expect(request).toHaveBeenCalledWith({
        url: '/lowcode/projects',
        method: 'GET',
        params: { page: 2, pageSize: 10 }
      });
    });
  });

  describe('createProject', () => {
    it('应该正确创建项目', async () => {
      const projectData = {
        name: '新项目',
        code: 'new-project',
        description: '项目描述'
      };

      const mockResponse = {
        id: '1',
        ...projectData,
        status: 'ACTIVE'
      };

      const { request } = await import('../../../service/request');
      vi.mocked(request).mockResolvedValue(mockResponse);

      const result = await createProject(projectData);

      expect(request).toHaveBeenCalledWith({
        url: '/lowcode/projects',
        method: 'POST',
        data: projectData
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateProject', () => {
    it('应该正确更新项目', async () => {
      const projectId = '1';
      const updateData = {
        name: '更新的项目',
        description: '更新的描述'
      };

      const mockResponse = {
        id: projectId,
        ...updateData,
        status: 'ACTIVE'
      };

      const { request } = await import('../../../service/request');
      vi.mocked(request).mockResolvedValue(mockResponse);

      const result = await updateProject(projectId, updateData);

      expect(request).toHaveBeenCalledWith({
        url: `/lowcode/projects/${projectId}`,
        method: 'PUT',
        data: updateData
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteProject', () => {
    it('应该正确删除项目', async () => {
      const projectId = '1';

      const { request } = await import('../../../service/request');
      vi.mocked(request).mockResolvedValue({ success: true });

      const result = await deleteProject(projectId);

      expect(request).toHaveBeenCalledWith({
        url: `/lowcode/projects/${projectId}`,
        method: 'DELETE'
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('错误处理', () => {
    it('应该正确处理API错误', async () => {
      const { request } = await import('../../../service/request');
      vi.mocked(request).mockRejectedValue(new Error('网络错误'));

      await expect(getProjects()).rejects.toThrow('网络错误');
    });
  });
});
