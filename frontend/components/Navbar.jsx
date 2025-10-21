import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  box-shadow: ${props => props.theme.shadows.md};
  z-index: 1000;
  padding: 1rem 0;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: ${props => props.theme.colors.surface};
    flex-direction: column;
    padding: 1rem;
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const Button = styled.button`
  background: ${props => props.variant === 'primary' ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.variant === 'primary' ? 'white' : props.theme.colors.text};
  border: ${props => props.variant === 'outline' ? `1px solid ${props.theme.colors.border}` : 'none'};
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.variant === 'primary' ? props.theme.colors.primaryDark : props.theme.colors.background};
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  padding: 0.5rem 0;
  min-width: 200px;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DropdownItem = styled(Link)`
  display: block;
  padding: 0.75rem 1rem;
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.text};

  @media (max-width: 768px) {
    display: block;
  }
`;

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <Nav>
      <NavContainer>
        <Logo to="/">FoodTracker</Logo>
        
        <MobileMenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰
        </MobileMenuButton>

        <NavLinks isOpen={isMenuOpen}>
          <NavLink to="/" onClick={() => setIsMenuOpen(false)}>Home</NavLink>
          <NavLink to="/search" onClick={() => setIsMenuOpen(false)}>Search</NavLink>
          
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</NavLink>
              <NavLink to="/favorites" onClick={() => setIsMenuOpen(false)}>Favorites</NavLink>
              <NavLink to="/alerts" onClick={() => setIsMenuOpen(false)}>Alerts</NavLink>
              
              <UserMenu>
                <Button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  {user?.firstName || 'User'} ▼
                </Button>
                <UserDropdown isOpen={isUserMenuOpen}>
                  <DropdownItem to="/dashboard" onClick={() => setIsUserMenuOpen(false)}>
                    Dashboard
                  </DropdownItem>
                  <DropdownItem to="/favorites" onClick={() => setIsUserMenuOpen(false)}>
                    Favorites
                  </DropdownItem>
                  <DropdownItem to="/alerts" onClick={() => setIsUserMenuOpen(false)}>
                    Price Alerts
                  </DropdownItem>
                  <DropdownItem as="button" onClick={handleLogout}>
                    Logout
                  </DropdownItem>
                </UserDropdown>
              </UserMenu>
            </>
          ) : (
            <UserMenu>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="primary" onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </UserMenu>
          )}
        </NavLinks>
      </NavContainer>
    </Nav>
  );
};

export default Navbar;
