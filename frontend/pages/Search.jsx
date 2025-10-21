import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const SearchHeader = styled.div`
  margin-bottom: 2rem;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 600px;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ResultsCount = styled.p`
  color: ${props => props.theme.colors.textLight};
  font-size: 1.1rem;
`;

const SortSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.theme.colors.textLight};
`;

const NoResultsIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const NoResultsTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text};
`;

const NoResultsText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 2rem;
`;

const SearchSuggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
`;

const SuggestionTag = styled.button`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }
`;

// API function
const searchProducts = async (query, category, sortBy, page = 0) => {
  const params = new URLSearchParams({
    query,
    limit: '20',
    offset: (page * 20).toString()
  });
  
  if (category) params.append('category', category);
  if (sortBy) params.append('sort', sortBy);
  
  const response = await fetch(`/api/products/search?${params}`);
  if (!response.ok) throw new Error('Search failed');
  return response.json();
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery(
    ['search', query, category, sortBy, page],
    () => searchProducts(query, category, sortBy, page),
    { enabled: !!query }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      setPage(0);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(0);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(0);
  };

  const suggestions = [
    'milk', 'bread', 'eggs', 'chicken', 'bananas', 'apples', 'rice', 'pasta'
  ];

  return (
    <Container>
      <SearchHeader>
        <form onSubmit={handleSearch}>
          <SearchInput
            type="text"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        
        <FiltersContainer>
          <FilterSelect value={category} onChange={handleCategoryChange}>
            <option value="">All Categories</option>
            <option value="dairy">Dairy & Eggs</option>
            <option value="meat">Meat & Seafood</option>
            <option value="produce">Produce</option>
            <option value="pantry">Pantry Staples</option>
            <option value="beverages">Beverages</option>
            <option value="snacks">Snacks</option>
            <option value="frozen">Frozen Foods</option>
            <option value="bakery">Bakery</option>
          </FilterSelect>
          
          <FilterSelect value={sortBy} onChange={handleSortChange}>
            <option value="relevance">Most Relevant</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
            <option value="newest">Newest First</option>
          </FilterSelect>
        </FiltersContainer>
      </SearchHeader>

      {isLoading && <LoadingSpinner />}

      {error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          Error loading search results. Please try again.
        </div>
      )}

      {data && !isLoading && (
        <>
          <ResultsHeader>
            <ResultsCount>
              {data.pagination.total} products found
            </ResultsCount>
          </ResultsHeader>

          {data.products.length > 0 ? (
            <Grid>
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </Grid>
          ) : (
            <NoResults>
              <NoResultsIcon>🔍</NoResultsIcon>
              <NoResultsTitle>No products found</NoResultsTitle>
              <NoResultsText>
                Try adjusting your search terms or browse our suggestions:
              </NoResultsText>
              <SearchSuggestions>
                {suggestions.map((suggestion) => (
                  <SuggestionTag
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      setSearchParams({ q: suggestion });
                    }}
                  >
                    {suggestion}
                  </SuggestionTag>
                ))}
              </SearchSuggestions>
            </NoResults>
          )}
        </>
      )}
    </Container>
  );
};

export default Search;
