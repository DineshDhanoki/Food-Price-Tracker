import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  background: ${props => props.theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: ${props => props.theme.colors.textLight};
`;

const Content = styled.div`
  padding: 1.5rem;
`;

const ProductName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Brand = styled.p`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const CurrentPrice = styled.span`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
`;

const OriginalPrice = styled.span`
  font-size: 1rem;
  color: ${props => props.theme.colors.textLight};
  text-decoration: line-through;
`;

const DiscountBadge = styled.span`
  background: ${props => props.theme.colors.success};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.8rem;
  font-weight: 500;
`;

const RetailerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textLight};
`;

const RetailerLogo = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const RetailerName = styled.span`
  font-weight: 500;
`;

const PriceChange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => props.changePercentage > 0 ? props.theme.colors.error : props.theme.colors.success};
`;

const ProductCard = ({ product }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getLowestPrice = () => {
    if (!product.prices || product.prices.length === 0) return null;
    return product.prices.reduce((lowest, price) => 
      price.price < lowest.price ? price : lowest
    );
  };

  const getHighestPrice = () => {
    if (!product.prices || product.prices.length === 0) return null;
    return product.prices.reduce((highest, price) => 
      price.price > highest.price ? price : highest
    );
  };

  const lowestPrice = getLowestPrice();
  const highestPrice = getHighestPrice();
  const priceRange = lowestPrice && highestPrice ? highestPrice.price - lowestPrice.price : 0;

  return (
    <Card>
      <ImageContainer>
        {product.image_url ? (
          <ProductImage src={product.image_url} alt={product.name} />
        ) : (
          <PlaceholderImage>🛒</PlaceholderImage>
        )}
      </ImageContainer>
      
      <Content>
        <ProductName>{product.name}</ProductName>
        {product.brand && <Brand>{product.brand}</Brand>}
        
        {lowestPrice && (
          <PriceContainer>
            <CurrentPrice>{formatPrice(lowestPrice.price)}</CurrentPrice>
            {lowestPrice.originalPrice && lowestPrice.originalPrice > lowestPrice.price && (
              <OriginalPrice>{formatPrice(lowestPrice.originalPrice)}</OriginalPrice>
            )}
            {lowestPrice.discountPercentage && lowestPrice.discountPercentage > 0 && (
              <DiscountBadge>-{Math.round(lowestPrice.discountPercentage)}%</DiscountBadge>
            )}
          </PriceContainer>
        )}

        {lowestPrice && (
          <RetailerInfo>
            {lowestPrice.retailerLogo && (
              <RetailerLogo src={lowestPrice.retailerLogo} alt={lowestPrice.retailerName} />
            )}
            <RetailerName>{lowestPrice.retailerName}</RetailerName>
          </RetailerInfo>
        )}

        {priceRange > 0 && (
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
            Price range: {formatPrice(lowestPrice.price)} - {formatPrice(highestPrice.price)}
          </div>
        )}

        {product.price_change_percentage && (
          <PriceChange changePercentage={product.price_change_percentage}>
            {product.price_change_percentage > 0 ? '↗' : '↘'}
            {Math.abs(product.price_change_percentage).toFixed(1)}%
          </PriceChange>
        )}

        <Link to={`/product/${product.product_id || product.id}`}>
          <button style={{
            width: '100%',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            View Details
          </button>
        </Link>
      </Content>
    </Card>
  );
};

export default ProductCard;
