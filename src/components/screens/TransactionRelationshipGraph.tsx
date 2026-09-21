import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ReactFlowInstance,
} from '@xyflow/react';
import {
  Search,
  Filter,
  User,
  CreditCard,
  ArrowRightLeft,
  Smartphone,
  Globe,
  Users,
  Landmark,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  ArrowRight,
  Flame,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import { ForensicEntity, CorrelationLink, FundFlowStep } from '../../types/forensic';
import {
  RelationshipNodeType,
  RelationshipEdgeType,
  GraphNodeItem,
  GraphEdgeItem,
  RiskInsight,
} from '../../types/relationshipGraph';
import { RelationshipGraphEngine } from '../../engine/relationshipGraphEngine';

interface TransactionRelationshipGraphProps {
  entities: ForensicEntity[];
  correlations: CorrelationLink[];
  fundFlowSteps: FundFlowStep[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  onExplainConnection?: (sourceId: string, targetId: string) => void;
}

// ---------------------------------------------------------------------------
// 1. Custom Node Renderer for 8 Core Entity Types
// ---------------------------------------------------------------------------
const CoreRelationshipNode: React.FC<{ data: any; selected: boolean }> = ({ data, selected }) => {
  const nodeType: RelationshipNodeType = data.nodeType || 'ACCOUNT';
  const riskScore: number = data.riskScore ?? 50;
  const isHighlighted: boolean = Boolean(data.isHighlighted);
  const isDimmed: boolean = Boolean(data.isDimmed);
  const isInvestigated: boolean = Boolean(data.isInvestigated);

  const isCritical = riskScore >= 80;
  const isHighRisk = riskScore >= 60;

  // Distinct Icon and Color configuration per entity type
  const getTypeConfig = () => {
    switch (nodeType) {
      case 'USER':
        return {
          icon: <User className="w-3.5 h-3.5 text-blue-700" />,
          label: 'Customer / User',
          accent: 'border-blue-200 text-blue-800 bg-blue-50',
          dot: 'bg-blue-600',
        };
      case 'ACCOUNT':
        return {
          icon: <CreditCard className="w-3.5 h-3.5 text-emerald-700" />,
          label: 'Account / UPI',
          accent: 'border-emerald-200 text-emerald-800 bg-emerald-50',
          dot: 'bg-emerald-600',
        };
      case 'TRANSACTION':
        return {
          icon: <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />,
          label: 'Transaction',
          accent: 'border-amber-200 text-amber-800 bg-amber-50',
          dot: 'bg-amber-600',
        };
      case 'DEVICE':
        return {
          icon: <Smartphone className="w-3.5 h-3.5 text-orange-700" />,
          label: 'Device',
          accent: 'border-orange-200 text-orange-800 bg-orange-50',
          dot: 'bg-orange-600',
        };
      case 'IP':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-purple-700" />,
          label: 'IP Address',
          accent: 'border-purple-200 text-purple-800 bg-purple-50',
          dot: 'bg-purple-600',
        };
      case 'BENEFICIARY':
        return {
          icon: <Users className="w-3.5 h-3.5 text-teal-700" />,
          label: 'Beneficiary',
          accent: 'border-teal-200 text-teal-800 bg-teal-50',
          dot: 'bg-teal-600',
        };
      case 'BANK':
        return {
          icon: <Landmark className="w-3.5 h-3.5 text-indigo-700" />,
          label: 'Bank',
          accent: 'border-indigo-200 text-indigo-800 bg-indigo-50',
          dot: 'bg-indigo-600',
        };
      case 'LOCATION':
        return {
          icon: <MapPin className="w-3.5 h-3.5 text-rose-700" />,
          label: 'Location',
          accent: 'border-rose-200 text-rose-800 bg-rose-50',
          dot: 'bg-rose-600',
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-slate-600" />,
          label: 'Entity',
          accent: 'border-slate-200 text-slate-700 bg-slate-50',
          dot: 'bg-slate-600',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 select-none shadow-xs min-w-[190px] max-w-[240px] relative ${
        isDimmed ? 'opacity-30 pointer-events-none' : 'opacity-100'
      } ${
        isInvestigated
          ? 'bg-[#EEF2FF] border-[#1E1B4B] ring-2 ring-[#ED1B24] shadow-md scale-105 z-30'
          : isHighlighted
          ? 'bg-[#EEF2FF]/70 border-[#383278] ring-2 ring-[#C7D2FE] shadow-xs scale-102 z-20'
          : selected
          ? 'bg-white border-[#1E1B4B] ring-2 ring-[#383278] shadow-md'
          : isCritical
          ? 'bg-white border-[#FECDD3] hover:border-[#ED1B24] hover:shadow-xs'
          : isHighRisk
          ? 'bg-white border-[#FDE68A] hover:border-[#D97706] hover:shadow-xs'
          : 'bg-white border-[#CBD5E1] hover:border-[#383278] hover:shadow-xs'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-[#64748B] !border-2 !border-white !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-[#64748B] !border-2 !border-white !w-2.5 !h-2.5" />
      <Handle type="target" position={Position.Top} className="!bg-[#64748B] !border-2 !border-white !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#64748B] !border-2 !border-white !w-2.5 !h-2.5" />

      {/* Header: Type icon & label + Risk badge */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {config.icon}
          <span className="text-[9.5px] font-bold tracking-wider uppercase font-mono text-[#64748B] truncate">
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {data.degree !== undefined && (
            <span className="text-[9px] font-mono text-[#64748B] bg-[#F5F6FA] px-1 py-0.2 rounded border border-[#CBD5E1]" title={`${data.degree} connections`}>
              {data.degree}d
            </span>
          )}
          <span
            className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${
              isCritical
                ? 'text-[#ED1B24] bg-[#FFF1F2] border-[#FECDD3]'
                : isHighRisk
                ? 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]'
                : 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]'
            }`}
          >
            {riskScore}
          </span>
        </div>
      </div>

      {/* Main Label */}
      <div className="font-mono text-xs font-bold text-[#1E1B4B] truncate" title={data.id}>
        {data.label || data.id}
      </div>

      {/* Subtitle / Key Metadata */}
      {data.subtext && (
        <div className="text-[10px] text-[#64748B] truncate mt-0.5 font-mono">
          {data.subtext}
        </div>
      )}

      {/* Active Investigation Marker */}
      {isInvestigated && (
        <div className="absolute -top-2 -right-2 px-1.5 py-0.2 bg-[#ED1B24] text-white rounded-full text-[8px] font-bold font-mono shadow-xs">
          CENTER
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  relationshipNode: CoreRelationshipNode,
};

// ---------------------------------------------------------------------------
// 2. Main Transaction Relationship Graph Component
// ---------------------------------------------------------------------------
export const TransactionRelationshipGraph: React.FC<TransactionRelationshipGraphProps> = ({
  entities,
  correlations,
  fundFlowSteps,
  selectedEntityId: initialSelectedEntityId,
  onSelectEntity,
}) => {
  // Graph engine data
  const { nodes: graphNodeItems, edges: graphEdgeItems } = useMemo(() => {
    return RelationshipGraphEngine.buildGraph(entities, correlations, fundFlowSteps);
  }, [entities, correlations, fundFlowSteps]);

  // Risk Intelligence Insights
  const riskInsights = useMemo(() => {
    return RelationshipGraphEngine.detectRiskInsights(graphNodeItems, graphEdgeItems);
  }, [graphNodeItems, graphEdgeItems]);

  // State Management
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedEntityId || 'TXN002');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [filterRiskLevel, setFilterRiskLevel] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [filterNodeType, setFilterNodeType] = useState<string>('ALL');
  const [filterEdgeType, setFilterEdgeType] = useState<string>('ALL');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [minConnections, setMinConnections] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'TIMELINE' | 'SCORING'>('DETAILS');

  // Investigation Mode State
  const [investigationCenter, setInvestigationCenter] = useState<string | null>(null);
  const [investigationDegree, setInvestigationDegree] = useState<number>(1);
  const [activeInsightId, setActiveInsightId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Synchronize selection with parent if changed externally
  React.useEffect(() => {
    if (initialSelectedEntityId && initialSelectedEntityId !== selectedId) {
      setSelectedId(initialSelectedEntityId);
    }
  }, [initialSelectedEntityId]);

  // Layout node positions in structured forensic tiers
  const layoutPositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {
      // Tier 1: Technical Infrastructure (Top y = 40)
      '103.10.10.1': { x: 260, y: 40 },
      '185.220.101.5': { x: 920, y: 40 },
      'DEV-RN11-982': { x: 480, y: 40 },
      'IMEI001': { x: 700, y: 40 },
      'IMEI002': { x: 1140, y: 40 },

      // Tier 2: Users & Initiating Accounts (y = 190)
      'USER-VICTIM': { x: 60, y: 190 },
      'victim@okhdfc': { x: 280, y: 190 },
      'USER-MULE1': { x: 500, y: 190 },
      'mule1@upi': { x: 720, y: 190 },
      'USER-MULE2': { x: 940, y: 190 },
      'mule2@upi': { x: 1160, y: 190 },
      'USER-CASHOUT': { x: 1380, y: 190 },
      'USER-MULE3': { x: 1600, y: 190 },

      // Tier 3: Transactions - Central Core Flow (y = 350)
      'TXN001': { x: 280, y: 350 },
      'TXN002': { x: 540, y: 350 },
      'TXN003': { x: 800, y: 350 },
      'TXN004': { x: 1060, y: 350 },
      'TXN005': { x: 1320, y: 350 },

      // Tier 4: Beneficiaries & Downstream Pools (y = 510)
      'BENEFICIARY-MULE1': { x: 280, y: 510 },
      'BENEFICIARY-MULE2': { x: 540, y: 510 },
      'BENEFICIARY-CASHOUT': { x: 800, y: 510 },
      'cashout@paytm': { x: 1020, y: 510 },
      'BENEFICIARY-MULE3': { x: 1240, y: 510 },
      'mule3@axis': { x: 1420, y: 510 },
      'BENEFICIARY-ATM': { x: 1600, y: 510 },

      // Tier 5: Financial Institutions & Physical Geo Locations (y = 670)
      'BANK-HDFC': { x: 160, y: 670 },
      'BANK-ICICI': { x: 460, y: 670 },
      'BANK-PAYTM': { x: 760, y: 670 },
      'BANK-AXIS': { x: 1060, y: 670 },
      'BANK-ATM': { x: 1360, y: 670 },
      'LOC-DELHI-SOUTH': { x: 280, y: 780 },
      'LOC-NOIDA-62': { x: 680, y: 780 },
      'LOC-SECTOR-18': { x: 1180, y: 780 },
    };

    // Auto-place any newly uploaded dynamic entities
    const unpositioned = graphNodeItems.filter(n => pos[n.id] === undefined);
    let extraCol = 0;
    unpositioned.forEach(n => {
      pos[n.id] = {
        x: 1700 + (extraCol % 4) * 230,
        y: 80 + Math.floor(extraCol / 4) * 160,
      };
      extraCol++;
    });

    return pos;
  }, [graphNodeItems]);

  // Active investigation subgraph filter calculation
  const investigationSubgraph = useMemo(() => {
    if (!investigationCenter) return null;
    return RelationshipGraphEngine.buildInvestigationSubgraph(
      investigationCenter,
      investigationDegree,
      graphNodeItems,
      graphEdgeItems
    );
  }, [investigationCenter, investigationDegree, graphNodeItems, graphEdgeItems]);

  // Selected Insight entity highlight set
  const selectedInsightNodeIds = useMemo(() => {
    if (!activeInsightId) return null;
    const ins = riskInsights.find(i => i.id === activeInsightId);
    return ins ? new Set(ins.entityIds) : null;
  }, [activeInsightId, riskInsights]);

  // Set of connected nodes to current selected node (for focus highlighting)
  const directlyConnectedNodeIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>([selectedId]);
    graphEdgeItems.forEach(e => {
      if (e.source === selectedId) set.add(e.target);
      if (e.target === selectedId) set.add(e.source);
    });
    return set;
  }, [selectedId, graphEdgeItems]);

  // Build ReactFlow Nodes with filtering & investigation state
  const reactFlowNodes: Node[] = useMemo(() => {
    return graphNodeItems
      .filter(item => {
        // Investigation Mode filter
        if (investigationSubgraph && !investigationSubgraph.nodeIds.has(item.id)) {
          return false;
        }

        // Entity type filter
        if (filterNodeType !== 'ALL' && item.nodeType !== filterNodeType) {
          return false;
        }

        // Risk Level filter
        if (filterRiskLevel === 'CRITICAL' && item.riskScore < 80) return false;
        if (filterRiskLevel === 'HIGH' && item.riskScore < 60) return false;
        if (filterRiskLevel === 'MEDIUM' && (item.riskScore < 40 || item.riskScore >= 60)) return false;

        // Min connections filter
        if (item.degree < minConnections) return false;

        return true;
      })
      .map(item => {
        const isSelected = item.id === selectedId;
        const isInvestigatedCenter = item.id === investigationCenter;
        const isInInsight = selectedInsightNodeIds?.has(item.id);
        const isDirectlyConnected = directlyConnectedNodeIds.has(item.id);

        const isDimmed =
          (selectedId && !isDirectlyConnected && !isInInsight && !isInvestigatedCenter) ||
          (selectedInsightNodeIds && !isInInsight);

        let subtext = '';
        if (item.nodeType === 'TRANSACTION') {
          subtext = `₹${item.metadata.amount?.toLocaleString('en-IN')} • ${item.metadata.timestamp || ''}`;
        } else if (item.nodeType === 'ACCOUNT') {
          subtext = item.metadata.bankName || item.metadata.accountNumber || '';
        } else if (item.nodeType === 'USER') {
          subtext = item.metadata.role || item.metadata.userName || '';
        } else if (item.nodeType === 'DEVICE') {
          subtext = item.metadata.deviceModel || item.metadata.imei || '';
        } else if (item.nodeType === 'IP') {
          subtext = item.metadata.location || item.metadata.isp || '';
        }

        return {
          id: item.id,
          type: 'relationshipNode',
          position: layoutPositions[item.id] || { x: 100, y: 100 },
          data: {
            id: item.id,
            label: item.label,
            nodeType: item.nodeType,
            riskScore: item.riskScore,
            degree: item.degree,
            subtext,
            isInvestigated: isInvestigatedCenter,
            isHighlighted: isDirectlyConnected || isInInsight,
            isDimmed,
          },
          selected: isSelected,
        };
      });
  }, [
    graphNodeItems,
    layoutPositions,
    selectedId,
    investigationCenter,
    investigationSubgraph,
    selectedInsightNodeIds,
    directlyConnectedNodeIds,
    filterNodeType,
    filterRiskLevel,
    minConnections,
  ]);

  // Build ReactFlow Edges with styles and markers
  const reactFlowEdges: Edge[] = useMemo(() => {
    const visibleNodeIds = new Set(reactFlowNodes.map(n => n.id));

    return graphEdgeItems
      .filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .filter(e => {
        if (filterEdgeType !== 'ALL' && e.relationship !== filterEdgeType) return false;
        if (minAmount > 0 && e.amount && e.amount < minAmount) return false;
        if (investigationSubgraph && !investigationSubgraph.edgeIds.has(e.id)) return false;
        return true;
      })
      .map(e => {
        const isConnectedToSelected = selectedId === e.source || selectedId === e.target;
        const isConnectedToInsight =
          selectedInsightNodeIds?.has(e.source) && selectedInsightNodeIds?.has(e.target);

        // Edge coloring per relationship
        let strokeColor = '#cbd5e1';
        if (isConnectedToSelected || isConnectedToInsight) {
          strokeColor = '#172554'; // Deep navy
        } else if (e.relationship === 'RECEIVES_FROM' || e.relationship === 'INITIATES') {
          strokeColor = '#059669'; // muted emerald
        } else if (e.relationship === 'SENT_TO') {
          strokeColor = '#d97706'; // muted amber
        } else if (e.relationship === 'USED_DEVICE' || e.relationship === 'SHARES_DEVICE') {
          strokeColor = '#ea580c'; // muted orange
        } else if (e.relationship === 'ORIGINATED_FROM' || e.relationship === 'SHARES_IP') {
          strokeColor = '#9333ea'; // muted purple
        } else if (e.relationship === 'ASSOCIATED_WITH') {
          strokeColor = '#e11d48'; // muted rose
        }

        const isDashed = e.relationship.startsWith('SHARES_') || e.relationship === 'USED_DEVICE';

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: e.isSuspicious || isConnectedToSelected,
          label: e.label,
          labelStyle: {
            fontSize: 9.5,
            fontWeight: 600,
            fill: isConnectedToSelected ? '#172554' : '#64748b',
            fontFamily: 'monospace',
          },
          labelBgStyle: {
            fill: '#ffffff',
            fillOpacity: 0.95,
            stroke: strokeColor,
            strokeWidth: 1,
          },
          style: {
            stroke: strokeColor,
            strokeWidth: isConnectedToSelected ? 2.5 : e.isSuspicious ? 2 : 1.5,
            strokeDasharray: isDashed ? '4 4' : undefined,
            opacity: selectedId && !isConnectedToSelected && !isConnectedToInsight ? 0.25 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 12,
            height: 12,
          },
        };
      });
  }, [
    graphEdgeItems,
    reactFlowNodes,
    selectedId,
    selectedInsightNodeIds,
    filterEdgeType,
    minAmount,
    investigationSubgraph,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  React.useEffect(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  React.useEffect(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);

  // Currently selected node object
  const activeNodeItem = useMemo(() => {
    return graphNodeItems.find(n => n.id === selectedId) || null;
  }, [graphNodeItems, selectedId]);

  // Transparent Relationship Risk Score calculation
  const relationshipRiskScore = useMemo(() => {
    if (!selectedId) return null;
    return RelationshipGraphEngine.calculateRiskScore(selectedId, graphNodeItems, graphEdgeItems);
  }, [selectedId, graphNodeItems, graphEdgeItems]);

  // Timeline events for active node
  const activeTimeline = useMemo(() => {
    if (!selectedId) return [];
    return RelationshipGraphEngine.getEntityTimeline(selectedId, graphNodeItems, graphEdgeItems);
  }, [selectedId, graphNodeItems, graphEdgeItems]);

  // Search Results filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return graphNodeItems.filter(
      n =>
        n.id.toLowerCase().includes(q) ||
        n.label.toLowerCase().includes(q) ||
        n.nodeType.toLowerCase().includes(q) ||
        (n.metadata.accountNumber && n.metadata.accountNumber.toLowerCase().includes(q)) ||
        (n.metadata.upiId && n.metadata.upiId.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, graphNodeItems]);

  // Handler to center graph on node
  const handleSelectAndCenterNode = useCallback(
    (nodeId: string) => {
      setSelectedId(nodeId);
      onSelectEntity(nodeId);
      setSearchQuery('');
      setIsSearchFocused(false);

      if (reactFlowInstance) {
        const node = reactFlowNodes.find(n => n.id === nodeId);
        if (node) {
          reactFlowInstance.setCenter(node.position.x + 100, node.position.y + 40, {
            zoom: 1.1,
            duration: 600,
          });
        }
      }
    },
    [reactFlowNodes, reactFlowInstance, onSelectEntity]
  );

  // Investigation Mode Trigger
  const handleStartInvestigation = (entityId: string) => {
    setInvestigationCenter(entityId);
    setInvestigationDegree(1);
    handleSelectAndCenterNode(entityId);
  };

  const handleResetInvestigation = () => {
    setInvestigationCenter(null);
    setInvestigationDegree(1);
    setActiveInsightId(null);
  };

  // Fullscreen toggle
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!isFullScreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  // Export investigation case snapshot
  const handleExportInvestigation = () => {
    const docket = {
      caseId: 'CF-2026-001',
      reportType: 'TRANSACTION_RELATIONSHIP_GRAPH_EXPORT',
      generatedAt: new Date().toISOString(),
      investigator: 'Inv. Avnish Agrawal (Lead Investigator)',
      focusedEntity: selectedId,
      relationshipRiskIndicator: relationshipRiskScore,
      investigatedSubgraphNodeCount: reactFlowNodes.length,
      investigatedSubgraphEdgeCount: reactFlowEdges.length,
      identifiedRiskInsights: riskInsights,
      activeNodes: reactFlowNodes.map(n => ({ id: n.id, type: n.data.nodeType, riskScore: n.data.riskScore })),
      activeEdges: reactFlowEdges.map(e => ({ source: e.source, target: e.target, rel: e.label })),
    };

    const blob = new Blob([JSON.stringify(docket, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Case-CF-2026-001-RelationshipGraph-${selectedId || 'snapshot'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full w-full bg-[#F5F6FA] text-[#1E1B4B] overflow-hidden relative select-none ${
        isFullScreen ? 'fixed inset-0 z-50 p-4' : ''
      }`}
    >
      {/* ------------------------------------------------------------------- */}
      {/* Top Header & Search / Filter Controls Bar */}
      {/* ------------------------------------------------------------------- */}
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20 shadow-xs">
        {/* Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#1E1B4B] flex items-center justify-center text-[#ED1B24] shadow-xs shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold text-[#1E1B4B] tracking-wider uppercase whitespace-nowrap">
              Transaction Relationship Graph
            </h1>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="relative w-full max-w-xs sm:max-w-sm">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search Transaction ID, UPI, Account, Device, IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#F5F6FA] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#1E1B4B] placeholder-[#64748B] focus:outline-hidden focus:border-[#383278] focus:ring-1 focus:ring-[#383278] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#64748B] hover:text-[#1E1B4B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#CBD5E1] rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-1.5 divide-y divide-[#E2E8F0]">
                {searchResults.map(result => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handleSelectAndCenterNode(result.id)}
                    className="w-full px-3 py-2 text-left hover:bg-[#EEF2FF]/60 rounded-lg flex items-center justify-between gap-2 group transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-xs text-[#1E1B4B] group-hover:text-[#383278] truncate">
                        {result.label}
                      </div>
                      <div className="text-[10px] text-[#64748B] font-mono truncate">
                        {result.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F5F6FA] text-[#64748B] font-mono border border-[#CBD5E1]">
                        {result.nodeType}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border ${
                          result.riskScore >= 80
                            ? 'text-[#ED1B24] bg-[#FFF1F2] border-[#FECDD3]'
                            : 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]'
                        }`}
                      >
                        {result.riskScore}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isFilterPanelOpen || filterNodeType !== 'ALL' || filterRiskLevel !== 'ALL'
                ? 'bg-[#1E1B4B] border-[#1E1B4B] text-white shadow-xs'
                : 'bg-white border-[#CBD5E1] text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEF2FF]'
            }`}
            title="Filter graph nodes and relationships"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Reset Zoom & Center */}
          <button
            type="button"
            onClick={() => reactFlowInstance?.fitView({ duration: 500 })}
            className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEF2FF] transition-all cursor-pointer"
            title="Reset View (Fit to screen)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Full Screen Toggle */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#EEF2FF] transition-all cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Canvas'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Export Case */}
          <button
            type="button"
            onClick={handleExportInvestigation}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EEF2FF] border border-[#CBD5E1] hover:border-[#383278] text-[#1E1B4B] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Save and export graph investigation docket"
          >
            <Download className="w-3.5 h-3.5 text-[#ED1B24]" />
            <span className="hidden md:inline">Export Case</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* Collapsible Filter Bar */}
      {/* ------------------------------------------------------------------- */}
      {isFilterPanelOpen && (
        <div className="bg-[#F5F6FA] border-b border-[#E2E8F0] px-4 py-2.5 z-20 flex flex-wrap items-center gap-4 text-xs">
          {/* Entity Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748B] font-bold text-[11px]">Entity:</span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {['ALL', 'TRANSACTION', 'ACCOUNT', 'USER', 'DEVICE', 'IP', 'BENEFICIARY', 'BANK', 'LOCATION'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterNodeType(type)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                    filterNodeType === type
                      ? 'bg-[#1E1B4B] text-white font-bold shadow-xs'
                      : 'bg-white text-[#64748B] hover:text-[#1E1B4B] border border-[#CBD5E1]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748B] font-bold text-[11px]">Risk:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFilterRiskLevel(lvl)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                    filterRiskLevel === lvl
                      ? 'bg-[#ED1B24] text-white font-bold shadow-xs'
                      : 'bg-white text-[#64748B] hover:text-[#1E1B4B] border border-[#CBD5E1]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Min Connections Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#64748B] font-bold text-[11px]">Min Links:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setMinConnections(c)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                    minConnections === c
                      ? 'bg-[#1E1B4B] text-white font-bold shadow-xs'
                      : 'bg-white text-[#64748B] hover:text-[#1E1B4B] border border-[#CBD5E1]'
                  }`}
                >
                  {c}+
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={() => {
              setFilterNodeType('ALL');
              setFilterRiskLevel('ALL');
              setFilterEdgeType('ALL');
              setMinConnections(1);
            }}
            className="text-[11px] text-[#ED1B24] hover:text-[#D0151D] hover:underline ml-auto font-bold cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Active Investigation Banner (when in Investigation Mode) */}
      {/* ------------------------------------------------------------------- */}
      {investigationCenter && (
        <div className="bg-[#EEF2FF] border-b border-[#C7D2FE] px-4 py-2 z-20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ED1B24] animate-ping" />
            <span className="font-bold text-[#1E1B4B]">ACTIVE INVESTIGATION FOCUS:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#C7D2FE] text-[#1E1B4B] font-bold">
              {investigationCenter}
            </span>
            <span className="text-[#383278] text-[11px] hidden sm:inline font-medium">
              Depth: {investigationDegree}-degree relationship perimeter ({reactFlowNodes.length} nodes, {reactFlowEdges.length} edges)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInvestigationDegree(d => Math.min(3, d + 1))}
              className="px-3 py-1 rounded-md bg-[#ED1B24] hover:bg-[#D0151D] text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-[0_2px_8px_rgba(237,27,36,0.25)]"
              title="Expand investigation perimeter to next hop"
            >
              <Plus className="w-3 h-3" />
              <span>Expand Next Hop (+1)</span>
            </button>

            {investigationDegree > 1 && (
              <button
                type="button"
                onClick={() => setInvestigationDegree(d => Math.max(1, d - 1))}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-[#EEF2FF] border border-[#C7D2FE] text-[#1E1B4B] text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                title="Contract investigation perimeter"
              >
                <Minus className="w-3 h-3" />
                <span>Contract</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetInvestigation}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-[#EEF2FF] border border-[#C7D2FE] text-[#1E1B4B] text-[11px] font-semibold cursor-pointer"
              title="Return to full network graph"
            >
              Show Full Graph
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Main Workspace Body: Canvas (Left) + Intelligence & Inspector (Right) */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Interactive ReactFlow Canvas */}
        <div className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            onNodeClick={(_, node) => {
              setSelectedId(node.id);
              onSelectEntity(node.id);
            }}
            onPaneClick={() => {
              // Clicking background keeps selection or focuses out
            }}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
            className="bg-[#F7F7F5]"
          >
            <Background color="#E5E5E2" gap={24} size={1.2} />
            <Controls className="!bg-white !border-[#E5E5E2] !text-[#171717] !rounded-lg !shadow-md" />
          </ReactFlow>

          {/* Quick Legend Overlay (Floating at bottom-left) */}
          <div className="absolute bottom-4 left-4 z-10 p-2.5 bg-white/95 border border-[#E5E5E2] rounded-xl shadow-md text-[10px] font-mono text-[#737373] space-y-1.5 pointer-events-none hidden sm:block">
            <div className="font-semibold uppercase tracking-wider text-[#171717] text-[9px]">Entity Legend</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-blue-600" /> Customer</span>
              <span className="flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-emerald-600" /> Account / UPI</span>
              <span className="flex items-center gap-1.5"><ArrowRightLeft className="w-3 h-3 text-amber-600" /> Transaction</span>
              <span className="flex items-center gap-1.5"><Smartphone className="w-3 h-3 text-orange-600" /> Device / IMEI</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-purple-600" /> Proxy IP</span>
              <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-teal-600" /> Beneficiary</span>
              <span className="flex items-center gap-1.5"><Landmark className="w-3 h-3 text-indigo-600" /> Bank Gateway</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-rose-600" /> Geo Location</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Right Forensic Inspector & Risk Intelligence Panel (Width: 360-400px) */}
        {/* ----------------------------------------------------------------- */}
        <aside className="w-80 sm:w-96 bg-white border-l border-[#E2E8F0] flex flex-col shrink-0 z-20 overflow-hidden shadow-xs">
          {/* Panel Navigation Tabs */}
          <div className="h-11 bg-[#F5F6FA] border-b border-[#E2E8F0] flex items-center divide-x divide-[#E2E8F0] text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('DETAILS')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'DETAILS'
                  ? 'bg-white text-[#1E1B4B] border-b-2 border-[#ED1B24] font-bold'
                  : 'text-[#64748B] hover:text-[#1E1B4B]'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${activeTab === 'DETAILS' ? 'text-[#ED1B24]' : 'text-[#64748B]'}`} />
              <span>Inspector</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TIMELINE')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'TIMELINE'
                  ? 'bg-white text-[#1E1B4B] border-b-2 border-[#ED1B24] font-bold'
                  : 'text-[#64748B] hover:text-[#1E1B4B]'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === 'TIMELINE' ? 'text-[#ED1B24]' : 'text-[#64748B]'}`} />
              <span>Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SCORING')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'SCORING'
                  ? 'bg-white text-[#1E1B4B] border-b-2 border-[#ED1B24] font-bold'
                  : 'text-[#64748B] hover:text-[#1E1B4B]'
              }`}
            >
              <ShieldAlert className={`w-3.5 h-3.5 ${activeTab === 'SCORING' ? 'text-[#ED1B24]' : 'text-[#64748B]'}`} />
              <span>Risk Factors</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ------------------------------------------------------------- */}
            {/* Tab 1: Node Details Inspector */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'DETAILS' && activeNodeItem && (
              <div className="space-y-4">
                {/* Node Identity Card */}
                <div className="p-4 rounded-xl bg-[#F5F6FA] border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-[#383278] px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE]">
                      {activeNodeItem.nodeType}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono border ${
                        activeNodeItem.riskScore >= 80
                          ? 'text-[#ED1B24] bg-[#FFF1F2] border-[#FECDD3]'
                          : activeNodeItem.riskScore >= 60
                          ? 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]'
                          : 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]'
                      }`}
                    >
                      Risk: {activeNodeItem.riskScore}/100
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1E1B4B] font-mono break-all">
                      {activeNodeItem.label}
                    </h3>
                    <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                      ID: {activeNodeItem.id}
                    </div>
                  </div>

                  {/* Primary "Investigate" Action Button */}
                  <button
                    type="button"
                    onClick={() => handleStartInvestigation(activeNodeItem.id)}
                    className="w-full py-2.5 bg-[#ED1B24] hover:bg-[#D0151D] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(237,27,36,0.35)] hover:shadow-[0_6px_20px_rgba(237,27,36,0.45)] cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    <span>Investigate Network Around Node</span>
                  </button>
                </div>

                {/* Connections & Topological Centrality */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#F5F6FA] border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block uppercase font-bold">Connections</span>
                    <span className="text-sm font-bold text-[#1E1B4B]">{activeNodeItem.degree} edges</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F5F6FA] border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block uppercase font-bold">First / Last Seen</span>
                    <span className="text-[11px] text-[#1E1B4B] block truncate font-medium">{activeNodeItem.firstSeen}</span>
                    <span className="text-[10px] text-[#64748B] block truncate">{activeNodeItem.lastSeen}</span>
                  </div>
                </div>

                {/* Important Risk Indicators */}
                {activeNodeItem.riskIndicators.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#ED1B24] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#ED1B24]" />
                      <span>Important Risk Indicators</span>
                    </div>
                    <ul className="space-y-1 text-xs text-[#991B1B] font-mono">
                      {activeNodeItem.riskIndicators.map((ind, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#ED1B24] font-bold">•</span>
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Connected Entities List */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#383278] flex items-center justify-between">
                    <span>Directly Connected Entities</span>
                    <span className="font-mono text-[#64748B] text-[10px] font-medium">{directlyConnectedNodeIds.size - 1} linked</span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {Array.from(directlyConnectedNodeIds)
                      .filter(id => id !== activeNodeItem.id)
                      .map(id => {
                        const targetNode = graphNodeItems.find(n => n.id === id);
                        if (!targetNode) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleSelectAndCenterNode(id)}
                            className="w-full p-2.5 rounded-lg bg-[#F5F6FA] hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#383278] text-left flex items-center justify-between gap-2 group transition-all cursor-pointer shadow-2xs"
                          >
                            <div className="min-w-0">
                              <span className="block text-xs font-bold font-mono text-[#1E1B4B] group-hover:text-[#383278] truncate">
                                {targetNode.label}
                              </span>
                              <span className="block text-[10px] text-[#64748B] font-mono truncate">
                                {targetNode.nodeType}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#ED1B24] group-hover:translate-x-1 transition-transform font-bold">
                              →
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Relevant Transactions */}
                {activeNodeItem.relevantTransactions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#383278]">
                      Relevant Transactions
                    </div>
                    <div className="space-y-1.5">
                      {activeNodeItem.relevantTransactions.map(tx => (
                        <div key={tx.id} className="p-2.5 rounded-lg bg-[#F5F6FA] border border-[#E2E8F0] text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1E1B4B]">{tx.id}</span>
                            <span className="font-bold text-emerald-700">₹{tx.amount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] flex items-center justify-between">
                            <span>{tx.time}</span>
                            <span className="text-emerald-700 font-medium">{tx.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Tab 2: Chronological Event Timeline */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'TIMELINE' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#1E1B4B] flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span>Chronological Activity Flow</span>
                  <span className="font-mono text-[10px] text-[#64748B] font-medium">{activeTimeline.length} events</span>
                </div>

                <div className="relative pl-5 border-l-2 border-[#E2E8F0] space-y-4">
                  {activeTimeline.map((ev, i) => (
                    <div key={i} className="relative group">
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                          ev.isUnusual ? 'bg-[#ED1B24]' : 'bg-[#1E1B4B]'
                        }`}
                      />

                      <div className="text-[11px] font-mono text-[#64748B] flex items-center justify-between">
                        <span>{ev.time}</span>
                        {ev.isUnusual && (
                          <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-[#FFF1F2] text-[#ED1B24] border border-[#FECDD3] uppercase font-mono">
                            Anomaly
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-[#1E1B4B] mt-0.5">
                        {ev.title}
                      </div>

                      <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Tab 3: Relationship Risk Scoring Factors */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'SCORING' && relationshipRiskScore && (
              <div className="space-y-4">
                {/* Score Banner */}
                <div className="p-4 rounded-xl bg-[#F5F6FA] border border-[#E2E8F0] text-center space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block font-mono">
                    Relationship Risk Indicator
                  </span>
                  <div
                    className={`text-3xl font-black font-mono ${
                      relationshipRiskScore.score >= 80
                        ? 'text-[#ED1B24]'
                        : relationshipRiskScore.score >= 60
                        ? 'text-[#B45309]'
                        : 'text-emerald-700'
                    }`}
                  >
                    {relationshipRiskScore.score} / 100
                  </div>
                  <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase font-mono border bg-white border-[#E2E8F0] text-[#383278]">
                    {relationshipRiskScore.level} RISK PERIMETER
                  </div>
                </div>

                {/* Score Contributing Factors */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#383278]">
                    Contributing Behavioral Factors
                  </div>

                  <div className="space-y-2">
                    {relationshipRiskScore.factors.map((factor, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#F5F6FA] border border-[#E2E8F0] space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-[#1E1B4B]">
                          <span>{factor.name}</span>
                          <span className="font-mono text-[#ED1B24]">+{factor.impact}</span>
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-tight">
                          {factor.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Automated Risk Intelligence Insights (Always Accessible) */}
            {/* ------------------------------------------------------------- */}
            <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
              <button
                type="button"
                onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#1E1B4B] cursor-pointer hover:text-[#383278] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#ED1B24]" />
                  <span>Automated Risk Insights ({riskInsights.length})</span>
                </div>
                {isInsightsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {isInsightsOpen && (
                <div className="space-y-2">
                  {riskInsights.map(insight => {
                    const isSelected = activeInsightId === insight.id;
                    return (
                      <div
                        key={insight.id}
                        className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EEF2FF] border-[#383278] shadow-xs ring-1 ring-[#383278]'
                            : 'bg-[#F5F6FA] border-[#E2E8F0] hover:border-[#383278]/40'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setActiveInsightId(null);
                          } else {
                            setActiveInsightId(insight.id);
                            // Highlight primary entity of insight
                            if (insight.entityIds[0]) {
                              handleSelectAndCenterNode(insight.entityIds[0]);
                            }
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-[#1E1B4B] leading-tight">
                            {insight.title}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] font-mono shrink-0 uppercase font-bold">
                            {insight.severity.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#64748B] leading-relaxed">
                          {insight.description}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B] flex items-center justify-between">
                          <span>Action: {insight.recommendation}</span>
                          <span className="text-[#ED1B24] underline font-bold shrink-0 ml-1">
                            {isSelected ? 'Clear' : 'Highlight'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TransactionRelationshipGraph;
