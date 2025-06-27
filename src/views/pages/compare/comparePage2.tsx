'use client';

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { NextPage } from 'next';
import {
  Row,
  Col,
  Table,
  Button as RSButton,
  Card as RSCard,
  CardBody,
} from 'reactstrap';
import Link from 'next/link';
import Breadcrumb from '../../Containers/Breadcrumb';
import { API } from '@/app/services/api.service';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CompareContext } from '../../../helpers/compare/compare.context';
import { Product } from '../../../app/models/product/product';

const SimpleCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RSCard className="mb-4">
    <CardBody>{children}</CardBody>
  </RSCard>
);

type Category = {
  name: string;
  attributes: {
    name: string;
    values: Record<string, string | number>;
  }[];
};

const ComparePage: NextPage = () => {
  const { compareItems, removeFromCompare, clearCompare } = useContext(CompareContext);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const { data, loading, error, retry } = useComparisonData(comparisonIds);

  // Get comparison IDs from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productsParam = urlParams.get('products');

    if (productsParam) {
      const ids = productsParam.split(',').map((id) => id.trim());
      setComparisonIds(ids);
    } else {
      // Get from context or localStorage
      if (compareItems && compareItems.length > 0) {
        setComparisonIds(compareItems.map(item => item.id));
      } else {
        const saved = localStorage.getItem('comparison-products');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setComparisonIds(parsed);
            }
          } catch (e) {
            console.error('Failed to parse saved comparison:', e);
          }
        }
      }
    }
  }, [compareItems]);

  const handleRemoveProduct = useCallback((productId: string) => {
    setComparisonIds((prev) => {
      const updated = prev.filter((id) => id !== productId);
      localStorage.setItem('comparison-products', JSON.stringify(updated));
      
      // Also remove from context
      const product = data?.products.find(p => p.id === productId);
      if (product) {
        removeFromCompare(product);
      }
      
      toast.info('Product removed from comparison.');
      return updated;
    });
  }, [data?.products, removeFromCompare]);

  const handleShareComparison = useCallback(() => {
    if (comparisonIds.length === 0) {
      toast.error('No products to share!');
      return;
    }
    
    const url = new URL(window.location.href);
    url.searchParams.set('products', comparisonIds.join(','));
    navigator.clipboard.writeText(url.toString());
    toast.success('Comparison link copied to clipboard!');
  }, [comparisonIds]);

  const handleClearAll = useCallback(() => {
    setComparisonIds([]);
    clearCompare();
    localStorage.removeItem('comparison-products');
    toast.info('All products removed from comparison.');
  }, [clearCompare]);

  if (loading) {
    return (
      <div className="container p-4">
        <p>Loading comparison...</p>
        <ToastContainer position="top-right" autoClose={2000} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-4">
        <Breadcrumb title="Product Comparison" parent="" />
        <SimpleCard>
          <p className="text-danger">🚧 {error}</p>
          <RSButton color="primary" onClick={retry}>Retry</RSButton>
        </SimpleCard>
        <ToastContainer position="top-right" autoClose={2000} />
      </div>
    );
  }

  if (!data || data.products.length === 0) {
    return (
      <div className="container p-4 text-center">
        <Breadcrumb title="Product Comparison" parent="" />
        <SimpleCard>
          <h4>No Products Selected</h4>
          <p>Add products to compare from the product catalog.</p>
          <Link href="/products">
            <RSButton color="primary">Browse Products</RSButton>
          </Link>
        </SimpleCard>
        <ToastContainer position="top-right" autoClose={2000} />
      </div>
    );
  }

  return (
    <div className="container p-4">
      <Breadcrumb title="Product Comparison" parent="" />
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2>Product Comparison</h2>
          <p className="text-muted">Comparing {data.products.length} products</p>
        </div>
        <div>
          <RSButton color="secondary" className="me-2" onClick={handleClearAll}>
            Clear All
          </RSButton>
          <RSButton color="primary" onClick={handleShareComparison}>
            Share Comparison
          </RSButton>
        </div>
      </div>

      {/* Summary Card */}
      <SimpleCard>
        <Row>
          <Col md={4}>
            <div className="text-center">
              <h5 className="text-primary">{data.products.length}</h5>
              <p className="mb-0">Products</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center">
              <h5 className="text-info">{data.summary.totalAttributes}</h5>
              <p className="mb-0">Attributes</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center">
              <h5 className="text-success">{data.summary.significantDifferences}</h5>
              <p className="mb-0">Key Differences</p>
            </div>
          </Col>
        </Row>
      </SimpleCard>

      {/* Product Images Row */}
      <SimpleCard>
        <Table borderless className="mb-0">
          <thead>
            <tr>
              <th style={{ width: '200px' }}></th>
              {data.products.map((prod) => (
                <th key={prod.id} className="text-center">
                  <div className="position-relative">
                    <RSButton
                      color="danger"
                      size="sm"
                      className="position-absolute top-0 end-0"
                      style={{ zIndex: 1 }}
                      onClick={() => handleRemoveProduct(prod.id)}
                    >
                      ×
                    </RSButton>
                    {prod.images && prod.images.length > 0 ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="img-fluid rounded"
                        style={{ maxHeight: '150px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '150px' }}>
                        <span className="text-muted">No Image</span>
                      </div>
                    )}
                    <h6 className="mt-2 mb-1">{prod.name}</h6>
                    {prod.price && (
                      <p className="text-primary font-weight-bold mb-0">
                        ${typeof prod.price === 'number' ? prod.price.toFixed(2) : prod.price}
                      </p>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        </Table>
      </SimpleCard>

      {/* Comparison Table */}
      <SimpleCard>
        <Table bordered responsive hover className="mb-0">
          <thead className="table-dark">
            <tr>
              <th style={{ width: '200px' }}>Attribute</th>
              {data.products.map((prod) => (
                <th key={prod.id} className="text-center">
                  {prod.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Basic Information */}
            <tr className="table-primary">
              <td colSpan={data.products.length + 1} className="font-weight-bold">
                <strong>Basic Information</strong>
              </td>
            </tr>
            <tr>
              <td><strong>Description</strong></td>
              {data.products.map((prod) => (
                <td key={`${prod.id}-description`}>
                  {prod.description || '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Brand</strong></td>
              {data.products.map((prod) => (
                <td key={`${prod.id}-brand`}>
                  {prod.brand || '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Category</strong></td>
              {data.products.map((prod) => (
                <td key={`${prod.id}-category`}>
                  {prod.category || '-'}
                </td>
              ))}
            </tr>

            {/* Specifications */}
            {data.categories.map((category) => (
              <React.Fragment key={category.name}>
                <tr className="table-secondary">
                  <td colSpan={data.products.length + 1} className="font-weight-bold">
                    <strong>{category.name}</strong>
                  </td>
                </tr>
                {category.attributes.map((attr) => (
                  <tr key={attr.name}>
                    <td><strong>{attr.name}</strong></td>
                    {data.products.map((prod) => (
                      <td key={`${prod.id}-${attr.name}`}>
                        {String(attr.values[prod.id] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </SimpleCard>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

function useComparisonData(productIds: string[]) {
  const [data, setData] = useState<{
    products: Product[];
    categories: Category[];
    summary: { totalAttributes: number; significantDifferences: number };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    if (!productIds || productIds.length === 0) {
      setData(null);
      setLoading(false);
      return;
    }

    if (productIds.length < 2) {
      setError('Please select at least 2 products to compare.');
      setLoading(false);
      return;
    }

    if (productIds.length > 4) {
      setError('You can compare maximum 4 products at a time.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const allProductsMap = await API.getAllProducts();
      const allProducts = Array.from(allProductsMap.values()).flat();

      const products = productIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined);

      if (products.length !== productIds.length) {
        throw new Error('Some products could not be found.');
      }

      // Collect all unique attributes from all products
      const attributesSet = new Set<string>();
      const attributeMap: Record<string, Record<string, string | number>> = {};

      for (const prod of products) {
        // Process specs
        if (prod.specs) {
          for (const [key, value] of Object.entries(prod.specs)) {
            attributesSet.add(key);
            if (!attributeMap[key]) attributeMap[key] = {};
            attributeMap[key][prod.id] =
              typeof value === 'string' || typeof value === 'number'
                ? value
                : String(value);
          }
        }

        // Process other product properties that might be useful for comparison
        const otherProps = ['weight', 'dimensions', 'color', 'material', 'warranty'];
        otherProps.forEach(prop => {
          if (prod[prop as keyof Product]) {
            attributesSet.add(prop);
            if (!attributeMap[prop]) attributeMap[prop] = {};
            attributeMap[prop][prod.id] = String(prod[prop as keyof Product]);
          }
        });
      }

      const categories: Category[] = [
        {
          name: 'Specifications',
          attributes: [...attributesSet].map((attr) => ({
            name: attr,
            values: attributeMap[attr],
          })),
        },
      ];

      // Calculate significant differences (attributes where values differ)
      let significantDifferences = 0;
      for (const attr of attributesSet) {
        const values = Object.values(attributeMap[attr]);
        const uniqueValues = new Set(values);
        if (uniqueValues.size > 1) {
          significantDifferences++;
        }
      }

      setData({
        products,
        categories,
        summary: {
          totalAttributes: attributesSet.size,
          significantDifferences,
        },
      });
    } catch (e) {
      console.error('Error fetching comparison data:', e);
      setError('Failed to fetch product details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [productIds]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  return { data, loading, error, retry: fetchComparison };
}

export default ComparePage;