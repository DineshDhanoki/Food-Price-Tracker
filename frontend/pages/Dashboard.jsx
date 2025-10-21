import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useQuery } from 'react-query';
import LoadingSpinner from '../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Welcome = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.text};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.surface};
  padding: 2rem;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.text};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme.colors.textLight};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
`;

const EmptyText = styled.p`
  margin-bottom: 1.5rem;
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

// API functions
const fetchDashboardData = async () => {
  const response = await fetch('/api/analytics/dashboard', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard data');
  return response.json();
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery('dashboard', fetchDashboardData);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading dashboard</div>;

  return (
    <Container>
      <Welcome>Welcome back, {user?.firstName}!</Welcome>
      
      <StatsGrid>
        <StatCard>
          <StatNumber>{data?.summary?.favoritesCount || 0}</StatNumber>
          <StatLabel>Favorite Products</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{data?.summary?.activeAlertsCount || 0}</StatNumber>
          <StatLabel>Active Price Alerts</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{data?.summary?.triggeredAlertsCount || 0}</StatNumber>
          <StatLabel>Alerts Triggered</StatLabel>
        </StatCard>
      </StatsGrid>

      <Section>
        <SectionTitle>Recent Price Changes</SectionTitle>
        {data?.recentPriceChanges?.length > 0 ? (
          <div>
            {data.recentPriceChanges.map((change, index) => (
              <div key={index} style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{change.product_name}</strong> - {change.retailer_name}
                </div>
                <div style={{
                  color: change.change_percentage > 0 ? '#ef4444' : '#10b981',
                  fontWeight: 'bold'
                }}>
                  {change.change_percentage > 0 ? '+' : ''}{change.change_percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>
            <EmptyIcon>📊</EmptyIcon>
            <EmptyTitle>No recent price changes</EmptyTitle>
            <EmptyText>Start tracking products to see price changes here</EmptyText>
            <Button onClick={() => window.location.href = '/search'}>
              Search Products
            </Button>
          </EmptyState>
        )}
      </Section>
    </Container>
  );
};

export default Dashboard;
