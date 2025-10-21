import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const Button = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.theme.colors.primaryDark};
  }
`;

const AlertCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ProductName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.5rem;
`;

const TargetPrice = styled.div`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const AlertActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${props => props.variant === 'danger' && `
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    
    &:hover {
      background: #dc2626;
      color: white;
    }
  `}

  ${props => props.variant === 'warning' && `
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fed7aa;
    
    &:hover {
      background: #d97706;
      color: white;
    }
  `}
`;

const CurrentPrices = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
`;

const PriceTag = styled.div`
  background: ${props => props.theme.colors.background};
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.theme.colors.textLight};
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
`;

const EmptyText = styled.p`
  margin-bottom: 2rem;
`;

// API functions
const fetchAlerts = async () => {
  const response = await fetch('/api/alerts', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
};

const deleteAlert = async (alertId) => {
  const response = await fetch(`/api/alerts/${alertId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to delete alert');
  return response.json();
};

const toggleAlert = async (alertId) => {
  const response = await fetch(`/api/alerts/${alertId}/toggle`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to toggle alert');
  return response.json();
};

const Alerts = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading, error } = useQuery('alerts', fetchAlerts, {
    enabled: isAuthenticated
  });

  const deleteMutation = useMutation(deleteAlert, {
    onSuccess: () => {
      queryClient.invalidateQueries('alerts');
      toast.success('Alert deleted');
    },
    onError: () => {
      toast.error('Failed to delete alert');
    }
  });

  const toggleMutation = useMutation(toggleAlert, {
    onSuccess: () => {
      queryClient.invalidateQueries('alerts');
      toast.success('Alert status updated');
    },
    onError: () => {
      toast.error('Failed to update alert');
    }
  });

  const handleDelete = (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      deleteMutation.mutate(alertId);
    }
  };

  const handleToggle = (alertId) => {
    toggleMutation.mutate(alertId);
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <EmptyState>
          <EmptyIcon>🔐</EmptyIcon>
          <EmptyTitle>Please log in</EmptyTitle>
          <EmptyText>You need to be logged in to view your price alerts.</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading alerts</div>;

  return (
    <Container>
      <Header>
        <Title>Price Alerts</Title>
        <Button onClick={() => setShowCreateForm(true)}>
          + Create Alert
        </Button>
      </Header>

      {data?.alerts?.length > 0 ? (
        data.alerts.map((alert) => (
          <AlertCard key={alert.id}>
            <AlertHeader>
              <div>
                <ProductName>{alert.product_name}</ProductName>
                <TargetPrice>Target: ${alert.target_price}</TargetPrice>
              </div>
              <AlertActions>
                <ActionButton
                  variant="warning"
                  onClick={() => handleToggle(alert.id)}
                >
                  {alert.is_active ? 'Disable' : 'Enable'}
                </ActionButton>
                <ActionButton
                  variant="danger"
                  onClick={() => handleDelete(alert.id)}
                >
                  Delete
                </ActionButton>
              </AlertActions>
            </AlertHeader>

            {alert.current_prices && alert.current_prices.length > 0 && (
              <CurrentPrices>
                {alert.current_prices.map((price, index) => (
                  <PriceTag key={index}>
                    {price.retailerName}: ${price.price.toFixed(2)}
                    {price.inStock ? ' ✅' : ' ❌'}
                  </PriceTag>
                ))}
              </CurrentPrices>
            )}
          </AlertCard>
        ))
      ) : (
        <EmptyState>
          <EmptyIcon>🔔</EmptyIcon>
          <EmptyTitle>No price alerts yet</EmptyTitle>
          <EmptyText>
            Create price alerts to get notified when your favorite products go on sale.
          </EmptyText>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Your First Alert
          </Button>
        </EmptyState>
      )}
    </Container>
  );
};

export default Alerts;
