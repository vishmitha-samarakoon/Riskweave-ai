// RiskWeave AI - Deterministic Relationship Graph Engine
import { Entity, Relationship, EntityType, RelationType, MatchState } from '../types';

export interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  matchState: MatchState;
  metadata?: Record<string, any>;
  hopDistance?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: RelationType;
  observedAt: string;
  method: string;
  matchState: MatchState;
  isCandidate: boolean;
  evidenceIds: string[];
}

export interface BoundedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootEntityId: string;
  maxHops: number;
  totalAvailableNodes: number;
  totalAvailableEdges: number;
  truncated: boolean;
  cycleDetected: boolean;
}

/**
 * Builds a deterministic, cycle-safe bounded neighborhood graph around a root entity.
 */
export function buildRelationshipGraph(
  rootEntityId: string,
  entities: Entity[],
  relationships: Relationship[],
  options: {
    maxHops?: number;
    maxNodes?: number;
    asOfTimestamp?: string;
    typeFilter?: EntityType[];
    includeCandidates?: boolean;
  } = {}
): BoundedGraph {
  const maxHops = options.maxHops ?? 2;
  const maxNodes = options.maxNodes ?? 30;
  const includeCandidates = options.includeCandidates ?? true;
  const asOfTime = options.asOfTimestamp ? new Date(options.asOfTimestamp).getTime() : Infinity;

  const entityMap = new Map<string, Entity>();
  entities.forEach(e => entityMap.set(e.entityId, e));

  // Filter edges strictly by cutoff timestamp and candidate preference
  const eligibleEdges = relationships.filter(rel => {
    const relTime = new Date(rel.observedAt).getTime();
    if (relTime > asOfTime) return false;
    if (!includeCandidates && rel.matchState === 'CANDIDATE_MATCH') return false;
    return true;
  });

  // Build adjacency list
  const adj = new Map<string, Array<{ edge: Relationship; neighborId: string }>>();
  entities.forEach(e => adj.set(e.entityId, []));

  eligibleEdges.forEach(edge => {
    if (!adj.has(edge.fromEntityId)) adj.set(edge.fromEntityId, []);
    if (!adj.has(edge.toEntityId)) adj.set(edge.toEntityId, []);

    adj.get(edge.fromEntityId)!.push({ edge, neighborId: edge.toEntityId });
    adj.get(edge.toEntityId)!.push({ edge, neighborId: edge.fromEntityId });
  });

  // Breadth-first traversal with cycle detection and depth limit
  const visitedNodes = new Map<string, number>(); // entityId -> hopDistance
  const selectedEdgeIds = new Set<string>();
  const queue: Array<{ entityId: string; hops: number }> = [{ entityId: rootEntityId, hops: 0 }];
  visitedNodes.set(rootEntityId, 0);

  let cycleDetected = false;
  let truncated = false;

  while (queue.length > 0) {
    const { entityId, hops } = queue.shift()!;

    if (visitedNodes.size >= maxNodes) {
      truncated = true;
      break;
    }

    if (hops >= maxHops) continue;

    const neighbors = adj.get(entityId) || [];
    for (const { edge, neighborId } of neighbors) {
      if (options.typeFilter && entityMap.has(neighborId)) {
        const neighborType = entityMap.get(neighborId)!.type;
        if (!options.typeFilter.includes(neighborType)) continue;
      }

      selectedEdgeIds.add(edge.edgeId);

      if (visitedNodes.has(neighborId)) {
        if (visitedNodes.get(neighborId)! >= hops) {
          cycleDetected = true;
        }
      } else {
        visitedNodes.set(neighborId, hops + 1);
        queue.push({ entityId: neighborId, hops: hops + 1 });
      }
    }
  }

  // Format nodes
  const nodes: GraphNode[] = [];
  visitedNodes.forEach((hopDistance, id) => {
    const ent = entityMap.get(id);
    if (ent) {
      nodes.push({
        id: ent.entityId,
        type: ent.type,
        label: ent.maskedDisplayLabel,
        matchState: ent.matchState,
        metadata: ent.metadata,
        hopDistance
      });
    }
  });

  // Format edges
  const edges: GraphEdge[] = [];
  eligibleEdges.forEach(rel => {
    if (visitedNodes.has(rel.fromEntityId) && visitedNodes.has(rel.toEntityId)) {
      edges.push({
        id: rel.edgeId,
        source: rel.fromEntityId,
        target: rel.toEntityId,
        relationType: rel.relationType,
        observedAt: rel.observedAt,
        method: rel.method,
        matchState: rel.matchState,
        isCandidate: rel.matchState === 'CANDIDATE_MATCH',
        evidenceIds: rel.evidenceIds
      });
    }
  });

  return {
    nodes,
    edges,
    rootEntityId,
    maxHops,
    totalAvailableNodes: entities.length,
    totalAvailableEdges: relationships.length,
    truncated,
    cycleDetected
  };
}

/**
 * Deterministic path search between two entities (e.g. Applicant -> Adverse Case)
 */
export function findGraphPath(
  startEntityId: string,
  targetEntityId: string,
  relationships: Relationship[]
): string[] | null {
  const queue: Array<{ current: string; path: string[] }> = [{ current: startEntityId, path: [startEntityId] }];
  const visited = new Set<string>([startEntityId]);

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    if (current === targetEntityId) return path;

    const edges = relationships.filter(r => r.fromEntityId === current || r.toEntityId === current);
    for (const edge of edges) {
      const next = edge.fromEntityId === current ? edge.toEntityId : edge.fromEntityId;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ current: next, path: [...path, next] });
      }
    }
  }
  return null;
}
