import React from 'react';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.text};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
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

// API function
const fetchFavorites = async () => {
  const response = await fetch('/api/products/favorites/list', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch favorites');
  return response.json();
};

const Favorites = () => {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error } = useQuery('favorites', fetchFavorites, {
    enabled: isAuthenticated
  });

  if (!isAuthenticated) {
    return (
      <Container>
        <EmptyState>
          <EmptyIcon>🔐</EmptyIcon>
          <EmptyTitle>Please log in</EmptyTitle>
          <EmptyText>You need to be logged in to view your favorite products.</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading favorites</div>;

  return (
    <Container>
      <Title>Your Favorite Products</Title>

      {data?.favorites?.length > 0 ? (
        <Grid>
          {data.favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Grid>
      ) : (
        <EmptyState>
          <EmptyIcon>❤️</EmptyIcon>
          <EmptyTitle>No favorites yet</EmptyTitle>
          <EmptyText>
            Start adding products to your favorites to track their prices.
          </EmptyText>
          <Button onClick={() => window.location.href = '/search'}>
            Browse Products
          </Button>
        </EmptyState>
      )}
    </Container>
  );
};

export default Favorites;
