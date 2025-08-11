<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { Graph } from '@antv/g6';

const message = useMessage();
const containerRef = ref<HTMLDivElement>();
let graph: any = null;

// 组件挂载时初始化图形
onMounted(() => {
  // 确保DOM已经渲染
  setTimeout(() => {
    initGraph();
    addTestData();
  }, 100);
});

// 组件卸载时销毁图形
onUnmounted(() => {
  if (graph) {
    graph.destroy();
    graph = null;
  }
});

// 初始化G6图 - 最简单的示例
function initGraph() {
  if (!containerRef.value) {
    console.error('容器元素不存在，无法初始化图形');
    message.error('容器元素不存在，无法初始化图形');
    return;
  }

  try {
    // 确保容器尺寸有效
    const containerWidth = containerRef.value.clientWidth || 800;
    const containerHeight = containerRef.value.clientHeight || 600;

    console.log('初始化G6图形，容器尺寸:', containerWidth, containerHeight);

    // 创建G6图形实例 - 最简单的配置
    graph = new Graph({
      container: containerRef.value,
      width: containerWidth,
      height: containerHeight,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'click-select']
      },
      defaultNode: {
        type: 'circle',
        size: 40,
        style: {
          fill: '#C6E5FF',
          stroke: '#5B8FF9',
          lineWidth: 2
        },
        labelCfg: {
          position: 'bottom',
          style: {
            fill: '#000',
            fontSize: 12
          }
        }
      },
      defaultEdge: {
        style: {
          stroke: '#aaa',
          lineWidth: 2,
          endArrow: true
        },
        labelCfg: {
          style: {
            fill: '#666',
            fontSize: 10
          }
        }
      }
    });

    console.log('G6图形初始化成功');
  } catch (error) {
    console.error('G6图形初始化失败:', error);
    message.error(`图形初始化失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 添加测试数据
function addTestData() {
  if (!graph) {
    console.error('图形实例不存在，无法添加数据');
    message.error('图形实例不存在，无法添加数据');
    return;
  }

  try {
    // 测试数据
    const data = {
      nodes: [
        { id: 'node1', label: '用户' },
        { id: 'node2', label: '订单' },
        { id: 'node3', label: '商品' },
        { id: 'node4', label: '支付' },
        { id: 'node5', label: '评论' },
        { id: 'node6', label: '地址' }
      ],
      edges: [
        { source: 'node1', target: 'node2', label: '一对多' },
        { source: 'node2', target: 'node3', label: '多对多' },
        { source: 'node2', target: 'node4', label: '一对一' },
        { source: 'node3', target: 'node5', label: '一对多' },
        { source: 'node1', target: 'node6', label: '一对多' },
        { source: 'node1', target: 'node5', label: '一对多' }
      ]
    };

    console.log('添加测试数据:', data);

    // 添加数据到图形
    graph.data(data);

    // 渲染图形
    graph.render();

    // 自动适应视图
    setTimeout(() => {
      if (graph && !graph.destroyed) {
        graph.fitView();
        console.log('自动适应视图完成');
      }
    }, 500);

    message.success('测试数据添加成功');
  } catch (error) {
    console.error('添加测试数据失败:', error);
    message.error(`添加测试数据失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 适应视图
function fitView() {
  if (!graph) return;
  graph.fitView();
}
</script>

<template>
  <div class="g6-relationship-designer">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="fitView">适应视图</button>
      <button @click="addTestData">添加测试数据</button>
    </div>

    <!-- G6画布容器 -->
    <div ref="containerRef" class="graph-container"></div>
  </div>
</template>

<style scoped>
.g6-relationship-designer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.toolbar button {
  margin-right: 8px;
  padding: 4px 8px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.graph-container {
  flex: 1;
  min-height: 500px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}
</style>
