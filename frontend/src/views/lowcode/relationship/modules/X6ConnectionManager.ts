/**
 * X6连接点管理器
 * 负责管理X6图形中的连接桩显示、连接逻辑和拖动跟随
 */
import type { Graph, Node } from '@antv/x6';

export interface ConnectionPoint {
  id: string;
  nodeId: string;
  group: 'top' | 'right' | 'bottom' | 'left';
  position: { x: number; y: number };
  port: string;
}

interface OptimalConnectionPoints {
  source: ConnectionPoint;
  target: ConnectionPoint;
}

export class X6ConnectionManager {
  private graph: Graph;
  private showConnectionPoints = false;
  
  constructor(graph: Graph) {
    this.graph = graph;
    this.setupEventListeners();
  }
  
  /**
   * 设置连接桩的显示状态
   * @param visible - 是否显示连接桩
   */
  setConnectionPointsVisible(visible: boolean) {
    this.showConnectionPoints = visible;
    this.updateAllNodePorts(visible);
  }
  
  /**
   * 更新所有节点的连接桩显示状态
   * @param visible - 是否显示
   */
  private updateAllNodePorts(visible: boolean) {
    const nodes = this.graph.getNodes();
    nodes.forEach(node => {
      this.updateNodePorts(node, visible);
    });
  }
  
  /**
   * 更新单个节点的连接桩显示状态
   * @param node - 节点
   * @param visible - 是否显示
   */
  private updateNodePorts(node: Node, visible: boolean) {
    const ports = node.getPorts();
    ports.forEach(port => {
      node.setPortProp(port.id!, 'attrs/circle/style/visibility', visible ? 'visible' : 'hidden');
    });
  }
  
  /**
   * 获取节点的所有连接点位置
   * @param nodeId - 节点ID
   * @returns 连接点数组
   */
  getNodeConnectionPoints(nodeId: string): ConnectionPoint[] {
    const node = this.graph.getCellById(nodeId) as Node;
    if (!node) return [];
    
    const ports = node.getPorts();
    const bbox = node.getBBox();
    
    return ports.map(port => {
      const portPosition = node.getPortProp(port.id!, 'position');
      let position: { x: number; y: number };
      
      // 根据连接桩组计算实际位置
      switch (port.group) {
        case 'top':
          const topX = port.args?.x ? String(port.args.x) : '50%';
          position = {
            x: bbox.x + bbox.width * (parseFloat(topX) / 100),
            y: bbox.y
          };
          break;
        case 'right':
          const rightY = port.args?.y ? String(port.args.y) : '50%';
          position = {
            x: bbox.x + bbox.width,
            y: bbox.y + bbox.height * (parseFloat(rightY) / 100)
          };
          break;
        case 'bottom':
          const bottomX = port.args?.x ? String(port.args.x) : '50%';
          position = {
            x: bbox.x + bbox.width * (parseFloat(bottomX) / 100),
            y: bbox.y + bbox.height
          };
          break;
        case 'left':
          const leftY = port.args?.y ? String(port.args.y) : '50%';
          position = {
            x: bbox.x,
            y: bbox.y + bbox.height * (parseFloat(leftY) / 100)
          };
          break;
        default:
          position = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
      }
      
      return {
        id: port.id!,
        nodeId,
        group: port.group as 'top' | 'right' | 'bottom' | 'left',
        position,
        port: port.id!
      };
    });
  }
  
  /**
   * 找到两个节点之间的最优连接点
   * @param sourceNodeId - 源节点ID
   * @param targetNodeId - 目标节点ID
   * @returns 最优连接点对
   */
  findOptimalConnectionPoints(sourceNodeId: string, targetNodeId: string): {
    source: ConnectionPoint | null;
    target: ConnectionPoint | null;
  } {
    const sourcePoints = this.getNodeConnectionPoints(sourceNodeId);
    const targetPoints = this.getNodeConnectionPoints(targetNodeId);
    
    if (sourcePoints.length === 0 || targetPoints.length === 0) {
      return { source: null, target: null };
    }
    
    let minDistance = Infinity;
    let bestSourcePoint: ConnectionPoint | null = null;
    let bestTargetPoint: ConnectionPoint | null = null;
    
    // 找到距离最短的连接点对
    sourcePoints.forEach(sourcePoint => {
      targetPoints.forEach(targetPoint => {
        const distance = this.calculateDistance(sourcePoint.position, targetPoint.position);
        if (distance < minDistance) {
          minDistance = distance;
          bestSourcePoint = sourcePoint;
          bestTargetPoint = targetPoint;
        }
      });
    });
    
    return {
      source: bestSourcePoint,
      target: bestTargetPoint
    };
  }
  
  /**
   * 计算两点之间的距离
   * @param point1 - 点1
   * @param point2 - 点2
   * @returns 距离
   */
  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    // 节点移动时更新连接线
    this.graph.on('node:moved', ({ node }) => {
      this.updateNodeConnections(node.id);
    });
    
    // 节点大小改变时更新连接线
    this.graph.on('node:resized', ({ node }) => {
      this.updateNodeConnections(node.id);
    });
    
    // 鼠标悬停显示连接桩
    this.graph.on('node:mouseenter', ({ node }) => {
      if (this.showConnectionPoints) {
        this.updateNodePorts(node, true);
      }
    });
    
    this.graph.on('node:mouseleave', ({ node }) => {
      if (this.showConnectionPoints) {
        this.updateNodePorts(node, false);
      }
    });
  }
  
  /**
   * 更新节点相关的所有连接线
   * @param nodeId - 节点ID
   */
  private updateNodeConnections(nodeId: string) {
    const edges = this.graph.getEdges();
    const relatedEdges = edges.filter(edge => 
      edge.getSourceCellId() === nodeId || edge.getTargetCellId() === nodeId
    );
    
    relatedEdges.forEach(edge => {
      const sourceId = edge.getSourceCellId();
      const targetId = edge.getTargetCellId();
      
      if (sourceId && targetId) {
        const optimalPoints = this.findOptimalConnectionPoints(sourceId, targetId);
        
        if (optimalPoints.source && optimalPoints.target) {
          // 更新边的连接点
          edge.setSource({ cell: sourceId, port: optimalPoints.source.id });
          edge.setTarget({ cell: targetId, port: optimalPoints.target.id });
        }
      }
    });
  }
  
  /**
   * 创建连接线
   * @param sourceNodeId - 源节点ID
   * @param targetNodeId - 目标节点ID
   * @param relationshipData - 关系数据
   * @returns 创建的边
   */
  createConnection(sourceNodeId: string, targetNodeId: string, relationshipData: any) {
    const optimalPoints = this.findOptimalConnectionPoints(sourceNodeId, targetNodeId);
    
    if (!optimalPoints.source || !optimalPoints.target) {
      throw new Error('无法找到合适的连接点');
    }
    
    const edge = this.graph.addEdge({
      id: relationshipData.id,
      source: { cell: sourceNodeId, port: optimalPoints.source.id },
      target: { cell: targetNodeId, port: optimalPoints.target.id },
      attrs: {
        line: {
          stroke: '#1976d2',
          strokeWidth: 2,
          targetMarker: {
            name: 'classic',
            size: 8,
          },
        },
      },
      labels: [
        {
          markup: [
            {
              tagName: 'rect',
              selector: 'body',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
          attrs: {
            label: {
              text: relationshipData.name || relationshipData.type,
              fill: '#333',
              fontSize: 12,
              textAnchor: 'middle',
              textVerticalAnchor: 'middle',
            },
            body: {
              fill: 'white',
              stroke: '#1976d2',
              strokeWidth: 1,
              rx: 4,
              ry: 4,
              refWidth: '100%',
              refHeight: '100%',
              refX: '-50%',
              refY: '-50%',
            },
          },
          position: {
            distance: 0.5,
          },
        },
      ],
      data: relationshipData,
    });
    
    return edge;
  }
  
  /**
   * 销毁管理器
   */
  destroy() {
    // 移除事件监听器
    this.graph.off('node:moved');
    this.graph.off('node:resized');
    this.graph.off('node:mouseenter');
    this.graph.off('node:mouseleave');
  }
}