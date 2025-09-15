"use client";

import React, { useState } from "react";
import { Card, CardBody, Button, Badge } from "reactstrap";
import { DeliveryAddressModel } from "@/app/globalProvider";

interface AddressListProps {
  addresses: DeliveryAddressModel[];
  onEdit: (address: DeliveryAddressModel) => void;
  onDelete: (addressId: number) => void;
  onAdd: () => void;
}

const AddressList: React.FC<AddressListProps> = ({
  addresses,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const [expandedAddressId, setExpandedAddressId] = useState<string | null | undefined>(null);


  return (
    <div>
      <div className="dashboard-page-title dashboard-mb-4">
        <h2>My Addresses</h2>
        {/* <p className="dashboard-text-muted">Manage your saved delivery addresses</p> */}
        {/* <Button color="primary" size="sm" onClick={onAdd}>
          + Add Address
        </Button> */}
      </div>

      {addresses.length === 0 ? (
        <Card className="dashboard-shadow-sm">
          <CardBody className="dashboard-text-center dashboard-py-5">
            <i className="fa fa-map-marker fa-4x dashboard-mb-3 dashboard-primary-color" />
            <h5>No addresses found</h5>
            <p>You haven’t saved any delivery addresses yet.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="dashboard-orders-scroll">
          {addresses.map((addr) => (
            <Card key={addr.id} className="dashboard-mb-3 dashboard-shadow-sm">
              <CardBody>
                <div
                  className="dashboard-flex dashboard-justify-content-between dashboard-align-items-center dashboard-cursor-pointer"
                  onClick={() =>
                    setExpandedAddressId(
                      expandedAddressId === addr.id ? null : addr.id
                    )
                  }
                >
                  <div>
                    <h6 className="dashboard-mb-1">
                      {addr.firstName} {addr.lastName}
                    </h6>
                    <small className="dashboard-text-muted">
                      📞 {addr.phoneNumber}
                    </small>
                  </div>
                  <div className="dashboard-flex dashboard-align-items-center dashboard-gap-3">
                    <Badge color="info">Saved</Badge>
                    <i
                      className={`fa ${
                        expandedAddressId === addr.id
                          ? "fa-chevron-up"
                          : "fa-chevron-down"
                      } dashboard-primary-color`}
                    />
                  </div>
                </div>

                {expandedAddressId === addr.id && (
                  <div className="dashboard-mt-3 dashboard-pt-3 dashboard-border-top">
                    <p className="dashboard-mb-1">
                      {addr.address}, {addr.city} - {addr.pinCode}
                    </p>
                    <div className="dashboard-flex dashboard-gap-50 dashboard-mt-2">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => onEdit(addr)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => addr.id && onDelete(addr.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressList;
