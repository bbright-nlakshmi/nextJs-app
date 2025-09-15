"use client";

import React, { useState, useEffect } from "react";
import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import { DeliveryAddressModel } from "@/app/globalProvider";
import { generateUniqueId } from "@/utils/idGenerator";

interface AddressFormProps {
  address?: DeliveryAddressModel;
  editingAddressId: string | null;
  setAddress: (address: DeliveryAddressModel) => void;
  setIsAddingAddress: (isAdding: boolean) => void;
  setEditingAddressId: (id: string | null) => void;
  onSave: (addressData: DeliveryAddressModel) => Promise<void>; 
  onCancel: () => void;
}

type AddressFormState = Omit<DeliveryAddressModel, "toMap" | "toJsonObj">;

const AddressForm: React.FC<AddressFormProps> = ({
  address,
  editingAddressId,
  setAddress,
  setIsAddingAddress,
  setEditingAddressId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<AddressFormState>(
    address || {
      id: generateUniqueId(),
      atStore: 0,
      firstName: "",
      lastName: "",
      pinCode: "",
      city: "",
      address: "",
      phoneNumber: "",
      lat: 0,
      lng: 0,
    }
  );

  // When editing, load the selected address into form
  useEffect(() => {
    if (address) {
      setFormData(address);
    }
  }, [address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // AddressForm.tsx - Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    
  e.preventDefault();
   if (!formData.firstName || !formData.lastName || !formData.address || 
      !formData.city || !formData.pinCode || !formData.phoneNumber) {
    alert("Please fill all required fields");
    return;
  }
  // Create a proper DeliveryAddressModel instance
  const addressToSave = new DeliveryAddressModel({
    id: formData.id || generateUniqueId(),
    atStore: formData.atStore || 0,
    firstName: formData.firstName,
    lastName: formData.lastName,
    pinCode: formData.pinCode,
    city: formData.city,
    address: formData.address,
    phoneNumber: formData.phoneNumber, // Use the form data, not user info
    lat: formData.lat || 0,
    lng: formData.lng || 0,
  });

  // Pass the address data directly to onSave
  await onSave(addressToSave);
  setIsAddingAddress(false);
  setEditingAddressId(null);
};

  return (
    <Form onSubmit={handleSubmit} className="p-3">
      <FormGroup>
        <Label>First Name</Label>
        <Input
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </FormGroup>
      <FormGroup>
        <Label>Last Name</Label>
        <Input
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </FormGroup>
      <FormGroup>
        <Label>Address</Label>
        <Input
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />
      </FormGroup>
      <FormGroup>
        <Label>City</Label>
        <Input
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />
      </FormGroup>
      <FormGroup>
        <Label>Pin Code</Label>
        <Input
          name="pinCode"
          value={formData.pinCode}
          onChange={handleChange}
          required
        />
      </FormGroup>
      <FormGroup>
        <Label>Phone</Label>
        <Input
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />
      </FormGroup>

      <div className="d-flex gap-2 mt-3">
        <Button color="primary" type="submit">
          {editingAddressId ? "Update" : "Save"}
        </Button>
        <Button color="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Form>
  );
};

export default AddressForm;
