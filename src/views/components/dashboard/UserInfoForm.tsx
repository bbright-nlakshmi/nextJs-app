// UserInfoForm.tsx
"use client";
import React from "react";
import { Row, Col, FormGroup, Label, Input, Button, Card, CardBody } from "reactstrap";

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
}

interface UserInfoFormProps {
  userInfo: UserInfo;
  editingUser: boolean;
  setEditingUser: (editing: boolean) => void;
  handleUserEdit: (field: keyof UserInfo, value: string) => void;
  handleSaveUserInfo: () => void;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({
  userInfo,
  editingUser,
  setEditingUser,
  handleUserEdit,
  handleSaveUserInfo,
}) => {
  return (
    <Card className="dashboard-shadow-sm dashboard-mb-4">
      <CardBody>
        <div className="dashboard-flex dashboard-justify-content-between dashboard-align-items-center dashboard-mb-4">
          <div>
            <h5 className="dashboard-mb-1 dashboard-section-title">
              <i className="fa fa-user dashboard-me-2 dashboard-primary-color" />
              Contact Information
            </h5>
            <p className="dashboard-text-muted dashboard-mb-0 dashboard-small">
              Keep your contact details up to date
            </p>
          </div>
          <Button
            color={editingUser ? "success" : "primary"}
            size="sm"
            onClick={() => editingUser ? handleSaveUserInfo() : setEditingUser(true)}
            className={`dashboard-edit-btn ${editingUser ? "dashboard-btn-success-custom-xs" : "dashboard-btn-primary-custom-xs"}`}
          >
            <i className={`fa ${editingUser ? "fa-check" : "fa-edit"} dashboard-me-1`} />
            {editingUser ? "Save" : "Edit"}
          </Button>
        </div>

        {editingUser ? (
          <Row>
            <Col md="6">
              <FormGroup className="dashboard-mb-3">
                <Label className="dashboard-form-label">
                  <i className="fa fa-user dashboard-me-2 dashboard-text-muted" />
                  Full Name
                </Label>
                <Input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => handleUserEdit("name", e.target.value)}
                  className="dashboard-form-control-custom"
                  placeholder="Enter your full name"
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup className="dashboard-mb-3">
                <Label className="dashboard-form-label">
                  <i className="fa fa-envelope dashboard-me-2 dashboard-text-muted" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleUserEdit("email", e.target.value)}
                  className="dashboard-form-control-custom"
                  placeholder="Enter your email address"
                />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup className="dashboard-mb-3">
                <Label className="dashboard-form-label">
                  <i className="fa fa-phone dashboard-me-2 dashboard-text-muted" />
                  Phone Number
                </Label>
                <Input
                  type="text"
                  value={userInfo.phone}
                  onChange={(e) => handleUserEdit("phone", e.target.value)}
                  className="dashboard-form-control-custom"
                  placeholder="Enter your phone number"
                />
              </FormGroup>
            </Col>
            <Col md="12">
              <div className="dashboard-flex dashboard-gap-2">
                <Button 
                  color="primary" 
                  onClick={handleSaveUserInfo}
                  className="dashboard-btn-primary-custom"
                >
                  Save Changes
                </Button>
                <Button 
                  color="secondary" 
                  onClick={() => setEditingUser(false)}
                  className="dashboard-btn-secondary-custom"
                >
                  Cancel
                </Button>
              </div>
            </Col>
          </Row>
        ) : (
          <Row>
            <Col md="4">
              <div className="dashboard-info-item dashboard-mb-3">
                <div className="dashboard-info-label">
                  <i className="fa fa-user dashboard-me-2 dashboard-primary-color" />
                  <strong>Name</strong>
                </div>
                <div className="dashboard-info-value">{userInfo.name || "Not provided"}</div>
              </div>
            </Col>
            <Col md="4">
              <div className="dashboard-info-item dashboard-mb-3">
                <div className="dashboard-info-label">
                  <i className="fa fa-envelope dashboard-me-2 dashboard-primary-color" />
                  <strong>Email</strong>
                </div>
                <div className="dashboard-info-value">{userInfo.email || "Not provided"}</div>
              </div>
            </Col>
            <Col md="4">
              <div className="dashboard-info-item dashboard-mb-3">
                <div className="dashboard-info-label">
                  <i className="fa fa-phone dashboard-me-2 dashboard-primary-color" />
                  <strong>Phone</strong>
                </div>
                <div className="dashboard-info-value">{userInfo.phone || "Not provided"}</div>
              </div>
            </Col>
          </Row>
        )}
      </CardBody>
    </Card>
  );
};

export default UserInfoForm;