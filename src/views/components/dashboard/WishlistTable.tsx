"use client";
import React, { JSX } from "react";
import { Card, CardBody, Table, Button } from "reactstrap";
import Link from "next/link";
import { WishlistProduct } from "../../../helpers/wishlist/wishlistStore";

export interface EnrichedWishlistItem extends WishlistProduct {
  title: string;
  img: string[];
  price: number;
  stock: number;
  isAvailable: boolean;
  cartItemId?: string;
  key?: string;
  id?: string;
  purchaseOptionStr?: string;
}

interface WishlistTableProps {
  enrichedWishlistData: EnrichedWishlistItem[];
  renderWishlistItem: (item: EnrichedWishlistItem, isMobile?: boolean) => JSX.Element;
  handleAddToCart: (item: EnrichedWishlistItem) => void;
  handleRemoveFromWishlist: (item: EnrichedWishlistItem) => void;
  symbol: string;
  value: number;
}

const WishlistTable: React.FC<WishlistTableProps> = ({ 
  enrichedWishlistData, 
  renderWishlistItem,
  handleAddToCart,
  handleRemoveFromWishlist,
  symbol,
  value
}) => {
  return (
    <div>
      <div className="dashboard-page-title dashboard-mb-4">
        <h2>My Wishlist</h2>
        <p className="dashboard-text-muted">Manage your saved items</p>
      </div>

      {enrichedWishlistData.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="dashboard-d-none dashboard-d-lg-block">
            <Card className="dashboard-wishlist-table-card dashboard-shadow-sm dashboard-border-0">
              <CardBody className="dashboard-p-0">
                <div className="dashboard-wishlist-scroll">
                  <Table responsive className="dashboard-wishlist-data-table dashboard-mb-0">
                    <thead className="dashboard-sticky-top dashboard-bg-light">
                      <tr className="dashboard-wishlist-header-row">
                        <th className="dashboard-text-center dashboard-p-3">Image</th>
                        <th className="dashboard-p-3">Product Name</th>
                        <th className="dashboard-text-center dashboard-p-3">Price</th>
                        <th className="dashboard-text-center dashboard-p-3">Availability</th>
                        <th className="dashboard-text-center dashboard-p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedWishlistData.map((item) => renderWishlistItem(item, false))}
                        
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="dashboard-d-block dashboard-d-lg-none">
            <div className="dashboard-wishlist-scroll">
              {enrichedWishlistData.map((item) => renderWishlistItem(item, true))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="dashboard-wishlist-action-buttons dashboard-mt-4">
            <div className="dashboard-flex dashboard-justify-content-between dashboard-flex-wrap dashboard-gap-3">
              <Link href="/">
                <Button
                  color="outline-primary"
                  size="lg"
                  className="dashboard-btn-primary-outline"
                >
                  <i className="fa fa-arrow-left dashboard-me-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/pages/account/checkout">
                <Button
                  color="primary"
                  size="lg"
                  className="dashboard-btn-primary-solid"
                >
                  Check Out
                  <i className="fa fa-arrow-right dashboard-ms-2" />
                </Button>
              </Link>
            </div>
          </div>
        </>
      ) : (
        <Card className="dashboard-wishlist-empty-card dashboard-shadow-sm dashboard-border-0">
          <CardBody className="dashboard-text-center dashboard-py-5">
            <i className="fa fa-heart fa-5x dashboard-mb-4 dashboard-primary-color" />
            <h3 className="dashboard-mb-3">
              <strong>Your wishlist is Empty</strong>
            </h3>
            <p className="dashboard-text-muted dashboard-mb-4">
              Explore more and shortlist some items.
            </p>
            <Link href="/">
              <Button color="primary" className="dashboard-btn-primary-solid">
                <i className="fa fa-shopping-cart dashboard-me-2" />
                Start Shopping
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default WishlistTable;
