import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const ProductHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const ImageContainer = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 2rem;
  text-align: center;
`;

const ProductImage = styled.img`
  max-width: 100%;
  height: 300px;
  object-fit: contain;
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: ${props => props.theme.colors.textLight};
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ProductName = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.theme.colors.text};
`;

const Brand = styled.p`
  color: ${props => props.theme.colors.textLight};
  font-size: 1.1rem;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CurrentPrice = styled.span`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
`;

const OriginalPrice = styled.span`
  font-size: 1.25rem;
  color: ${props => props.theme.colors.textLight};
  text-decoration: line-through;
`;

const DiscountBadge = styled.span`
  background: ${props => props.theme.colors.success};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
`;

const Button = styled.button`
  background: ${props => props.variant === 'primary' ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.variant === 'primary' ? 'white' : props.theme.colors.primary};
  border: ${props => props.variant === 'outline' ? `2px solid ${props.theme.colors.primary}` : 'none'};
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.variant === 'primary' ? props.theme.colors.primaryDark : props.theme.colors.primary};
    color: white;
  }
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

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const PriceCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 2px solid ${props => props.isLowest ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const RetailerName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
`;

const Price = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const Availability = styled.div`
  color: ${props => props.inStock ? props.theme.colors.success : props.theme.colors.error};
  font-weight: 500;
  font-size: 0.9rem;
`;

const LastUpdated = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.8rem;
  margin-top: 0.5rem;
`;

// API functions
const fetchProductDetails = async (productId) => {
  const response = await fetch(`/api/products/${productId}`);
  if (!response.ok) throw new Error('Failed to fetch product details');
  return response.json();
};

const ProductDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  const { data, isLoading, error } = useQuery(
    ['product', id],
    () => fetchProductDetails(id)
  );

  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add favorites');
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsFavorite(true);
        toast.success('Added to favorites!');
      } else {
        toast.error('Failed to add to favorites');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleSetAlert = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to set price alerts');
      return;
    }
    // Navigate to alerts page or open modal
    window.location.href = '/alerts';
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading product details</div>;
  if (!data?.product) return <div>Product not found</div>;

  const product = data.product;
  const lowestPrice = product.prices?.reduce((lowest, price) => 
    price.price < lowest.price ? price : lowest
  );

  return (
    <Container>
      <ProductHeader>
        <ImageContainer>
          {product.image_url ? (
            <ProductImage src={product.image_url} alt={product.name} />
          ) : (
            <PlaceholderImage>🛒</PlaceholderImage>
          )}
        </ImageContainer>

        <ProductInfo>
          <ProductName>{product.name}</ProductName>
          {product.brand && <Brand>{product.brand}</Brand>}
          
          {lowestPrice && (
            <PriceContainer>
              <CurrentPrice>${lowestPrice.price.toFixed(2)}</CurrentPrice>
              {lowestPrice.originalPrice && lowestPrice.originalPrice > lowestPrice.price && (
                <>
                  <OriginalPrice>${lowestPrice.originalPrice.toFixed(2)}</OriginalPrice>
                  {lowestPrice.discountPercentage && (
                    <DiscountBadge>-{Math.round(lowestPrice.discountPercentage)}%</DiscountBadge>
                  )}
                </>
              )}
            </PriceContainer>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Button variant="primary" onClick={handleAddToFavorites}>
              {isFavorite ? '❤️ In Favorites' : '❤️ Add to Favorites'}
            </Button>
            <Button variant="outline" onClick={handleSetAlert}>
              🔔 Set Price Alert
            </Button>
          </div>
        </ProductInfo>
      </ProductHeader>

      <Section>
        <SectionTitle>Compare Prices</SectionTitle>
        <PriceGrid>
          {product.prices?.map((price, index) => (
            <PriceCard key={index} isLowest={price.price === lowestPrice?.price}>
              <RetailerName>{price.retailerName}</RetailerName>
              <Price>${price.price.toFixed(2)}</Price>
              {price.originalPrice && price.originalPrice > price.price && (
                <div style={{ color: '#64748b', textDecoration: 'line-through', fontSize: '0.9rem' }}>
                  ${price.originalPrice.toFixed(2)}
                </div>
              )}
              <Availability inStock={price.inStock}>
                {price.inStock ? 'In Stock' : 'Out of Stock'}
              </Availability>
              <LastUpdated>
                Updated {new Date(price.lastUpdated).toLocaleDateString()}
              </LastUpdated>
            </PriceCard>
          ))}
        </PriceGrid>
      </Section>
    </Container>
  );
};

export default ProductDetails;
