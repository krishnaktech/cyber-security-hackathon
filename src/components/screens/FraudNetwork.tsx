import React from 'react';
import { ForensicEntity, CorrelationLink, FundFlowStep } from '../../types/forensic';
import { TransactionRelationshipGraph } from './TransactionRelationshipGraph';

interface FraudNetworkProps {
  entities: ForensicEntity[];
  correlations: CorrelationLink[];
  fundFlowSteps: FundFlowStep[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  onExplainConnection?: (sourceId: string, targetId: string) => void;
}

export const FraudNetwork: React.FC<FraudNetworkProps> = (props) => {
  return <TransactionRelationshipGraph {...props} />;
};

export default FraudNetwork;
