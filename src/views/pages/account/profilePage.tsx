import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { Input, Label, Row, Col, Form, FormGroup } from "reactstrap";
import Breadcrumb from "../../Containers/Breadcrumb";

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  message: string;
  flatPlot: string;
  address: string;
  zipCode: string;
  country: string;
  city: string;
  regionState: string;
}

const Profile: NextPage = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    message: '',
    flatPlot: '',
    address: '',
    zipCode: '',
    country: 'India',
    city: '',
    regionState: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setProfileData(parsedProfile);
      } catch (error) {
        console.error('Error parsing saved profile:', error);
      }
    }
  }, []);

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save profile data
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        
        // Also save essential login info separately for quick access
        const loginInfo = {
          name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          phoneNumber: profileData.phoneNumber,
          email: profileData.email
        };
        localStorage.setItem('userLoginInfo', JSON.stringify(loginInfo));
        
        setSaveMessage('Profile saved successfully!');
        setIsLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('Error saving profile:', error);
        setSaveMessage('Error saving profile. Please try again.');
        setIsLoading(false);
      }
    }, 1000);
  };

  // Clear profile data
  const handleClearProfile = () => {
    setProfileData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      message: '',
      flatPlot: '',
      address: '',
      zipCode: '',
      country: 'India',
      city: '',
      regionState: ''
    });
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userLoginInfo');
    setSaveMessage('Profile cleared successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <>
      <Breadcrumb title="Profile" parent="home" />
      {/* Success/Error Message */}
      {saveMessage && (
        <div className="alert alert-info text-center" role="alert">
          {saveMessage}
        </div>
      )}
      
      {/* Personal detail section start */}
      <section className="contact-page register-page section-big-py-space bg-light">
        <div className="custom-container">
          <Row className="row">
            <Col lg="6">
              <h3 className="mb-3">PERSONAL DETAIL</h3>
              <Form className="theme-form" onSubmit={handleSaveProfile}>
                <div className="form-row row">
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="firstName" 
                        placeholder="Enter Your name" 
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="lastName" 
                        placeholder="Last Name" 
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="phoneNumber">Phone number</Label>
                      <Input 
                        type="tel" 
                        className="form-control" 
                        id="phoneNumber"
                        placeholder="Enter your number" 
                        value={profileData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        type="email" 
                        className="form-control" 
                        id="email"
                        placeholder="Email" 
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col className="col-md-12">
                    <FormGroup>
                      <Label htmlFor="message">Delivery Instructions</Label>
                      <textarea 
                        className="form-control mb-0" 
                        placeholder="Write Your Message" 
                        id="message"
                        value={profileData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={4}
                      />
                    </FormGroup>
                  </Col>
                </div>
              </Form>
            </Col>
            <Col lg="6">
              <h3 className="mb-3 spc-responsive">SHIPPING ADDRESS</h3>
              <Form className="theme-form">
                <div className="form-row row">
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="flatPlot">Flat / Plot</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="flatPlot" 
                        placeholder="Company name" 
                        value={profileData.flatPlot}
                        onChange={(e) => handleInputChange('flatPlot', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="address">Address *</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="address" 
                        placeholder="Address" 
                        value={profileData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="zipCode" 
                        placeholder="zip-code" 
                        value={profileData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6" className="select_input">
                    <FormGroup>
                      <Label>Country *</Label>
                      <select 
                        className="form-control"
                        value={profileData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      >
                        <option value="India">India</option>
                        <option value="UAE">UAE</option>
                        <option value="U.K">U.K</option>
                        <option value="US">US</option>
                      </select>
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="city">City *</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="city" 
                        placeholder="City" 
                        value={profileData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="regionState">Region/State *</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="regionState" 
                        placeholder="Region/state" 
                        value={profileData.regionState}
                        onChange={(e) => handleInputChange('regionState', e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="12">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-normal mb-lg-5" 
                        type="submit"
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save setting'}
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-secondary mb-lg-5" 
                        type="button"
                        onClick={handleClearProfile}
                      >
                        Clear Profile
                      </button>
                    </div>
                  </Col>
                </div>
              </Form>
            </Col>
          </Row>
        </div>
      </section>
      {/* Section ends */}
    </>
  );
};

export default Profile;