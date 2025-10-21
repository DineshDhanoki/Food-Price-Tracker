import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Hero = styled.section`
  text-align: center;
  padding: 4rem 0;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.primaryDark} 100%);
  color: white;
  margin: -2rem -1rem 4rem -1rem;
  border-radius: 0 0 2rem 2rem;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
`;

const SearchContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.lg};
  outline: none;

  &::placeholder {
    color: ${props => props.theme.colors.textLight};
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.theme.colors.primaryDark};
  }
`;

const Section = styled.section`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
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

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.colors.surface};
  padding: 2rem;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  text-align: center;
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text};
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme.colors.textLight};
  line-height: 1.6;
`;

// API functions
const fetchTrendingProducts = async () => {
  const response = await fetch('/api/prices/trending?limit=8');
  if (!response.ok) throw new Error('Failed to fetch trending products');
  return response.json();
};

const fetchBestDeals = async () => {
  const response = await fetch('/api/prices/deals?limit=8');
  if (!response.ok) throw new Error('Failed to fetch best deals');
  return response.json();
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: trendingData, isLoading: trendingLoading } = useQuery(
    'trending-products',
    fetchTrendingProducts,
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: dealsData, isLoading: dealsLoading } = useQuery(
    'best-deals',
    fetchBestDeals,
    { staleTime: 5 * 60 * 1000 }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Container>
      <Hero>
        <HeroTitle>Track Food Prices, Save Money</HeroTitle>
        <HeroSubtitle>
          Compare prices across multiple retailers and get alerts when prices drop
        </HeroSubtitle>
        <SearchContainer>
          <form onSubmit={handleSearch}>
            <SearchInput
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchButton type="submit">Search</SearchButton>
          </form>
        </SearchContainer>
      </Hero>

      <StatsGrid>
        <StatCard>
          <StatNumber>50K+</StatNumber>
          <StatLabel>Products Tracked</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>15+</StatNumber>
          <StatLabel>Retailers</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>1M+</StatNumber>
          <StatLabel>Price Updates Daily</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>25%</StatNumber>
          <StatLabel>Average Savings</StatLabel>
        </StatCard>
      </StatsGrid>

      <Section>
        <SectionTitle>Trending Products</SectionTitle>
        {trendingLoading ? (
          <LoadingSpinner />
        ) : (
          <Grid>
            {trendingData?.trending?.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </Grid>
        )}
      </Section>

      <Section>
        <SectionTitle>Best Deals</SectionTitle>
        {dealsLoading ? (
          <LoadingSpinner />
        ) : (
          <Grid>
            {dealsData?.deals?.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </Grid>
        )}
      </Section>

      <FeaturesGrid>
        <FeatureCard>
          <FeatureIcon>🔍</FeatureIcon>
          <FeatureTitle>Smart Search</FeatureTitle>
          <FeatureDescription>
            Find the best prices for your favorite products across multiple retailers with our intelligent search engine.
          </FeatureDescription>
        </FeatureCard>
        <FeatureCard>
          <FeatureIcon>📊</FeatureIcon>
          <FeatureTitle>Price Analytics</FeatureTitle>
          <FeatureDescription>
            Track price trends and get insights on when to buy with our comprehensive price history and analytics.
          </FeatureDescription>
        </FeatureCard>
        <FeatureCard>
          <FeatureIcon>🔔</FeatureIcon>
          <FeatureTitle>Price Alerts</FeatureTitle>
          <FeatureDescription>
            Set price alerts for your favorite products and get notified when prices drop to your target level.
          </FeatureDescription>
        </FeatureCard>
      </FeaturesGrid>
    </Container>
  );
};

export default Home;
