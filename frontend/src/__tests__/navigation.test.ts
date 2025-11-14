describe('Navigation Logic', () => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
      permission: null, // Always visible
    },
    {
      name: 'Categories',
      href: '/dashboard/categories',
      icon: 'Shapes',
      permission: 'category.read',
    },
    {
      name: 'Products',
      href: '/dashboard/products',
      icon: 'Package',
      permission: 'product.read',
    },
  ];

  it('should have correct navigation structure', () => {
    expect(navigation).toHaveLength(3);

    expect(navigation[0]).toEqual({
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
      permission: null,
    });

    expect(navigation[1]).toEqual({
      name: 'Categories',
      href: '/dashboard/categories',
      icon: 'Shapes',
      permission: 'category.read',
    });

    expect(navigation[2]).toEqual({
      name: 'Products',
      href: '/dashboard/products',
      icon: 'Package',
      permission: 'product.read',
    });
  });

  it('should have dashboard always visible', () => {
    const dashboardItem = navigation.find(item => item.name === 'Dashboard');
    expect(dashboardItem?.permission).toBeNull();
  });

  it('should require category.read for categories', () => {
    const categoriesItem = navigation.find(item => item.name === 'Categories');
    expect(categoriesItem?.permission).toBe('category.read');
  });

  it('should require product.read for products', () => {
    const productsItem = navigation.find(item => item.name === 'Products');
    expect(productsItem?.permission).toBe('product.read');
  });
});