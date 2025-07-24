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

interface SavedAddress {
  id: string;
  label: string;
  flatPlot: string;
  address: string;
  zipCode: string;
  country: string;
  city: string;
  regionState: string;
  isDefault: boolean;
}

interface UserLoginInfo {
  name: string;
  phoneNumber: string;
  email: string;
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
  const [currentUser, setCurrentUser] = useState<UserLoginInfo | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressList, setShowAddressList] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');

  // Load data from memory storage on component mount
  useEffect(() => {
    // Check if user is logged in
    const loginInfo = getStoredData('userLoginInfo');
    if (loginInfo) {
      try {
        const parsedLoginInfo: UserLoginInfo = JSON.parse(loginInfo);
        setCurrentUser(parsedLoginInfo);
        
        // Load user's profile data
        const userProfileKey = `userProfile_${parsedLoginInfo.email}`;
        const savedProfile = getStoredData(userProfileKey);
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          setProfileData(parsedProfile);
        } else {
          // Pre-fill with login info if no saved profile
          setProfileData(prev => ({
            ...prev,
            firstName: parsedLoginInfo.name.split(' ')[0] || '',
            lastName: parsedLoginInfo.name.split(' ').slice(1).join(' ') || '',
            phoneNumber: parsedLoginInfo.phoneNumber,
            email: parsedLoginInfo.email
          }));
        }
        
        // Load user's saved addresses
        loadUserAddresses(parsedLoginInfo.email);
      } catch (error) {
        console.error('Error parsing login info:', error);
      }
    }
  }, []);

  // Memory storage functions (replacing localStorage)
  const memoryStorage: { [key: string]: string } = {};
  
  const getStoredData = (key: string): string | null => {
    return memoryStorage[key] || null;
  };
  
  const setStoredData = (key: string, value: string): void => {
    memoryStorage[key] = value;
  };
  
  const removeStoredData = (key: string): void => {
    delete memoryStorage[key];
  };

  // Load user's saved addresses
  const loadUserAddresses = (userEmail: string) => {
    const addressesKey = `savedAddresses_${userEmail}`;
    const addresses = getStoredData(addressesKey);
    if (addresses) {
      try {
        setSavedAddresses(JSON.parse(addresses));
      } catch (error) {
        console.error('Error parsing saved addresses:', error);
        setSavedAddresses([]);
      }
    }
  };

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
    if (!currentUser) {
      setSaveMessage('Please log in to save your profile.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        // Save to memory storage with user-specific key
        const userProfileKey = `userProfile_${currentUser.email}`;
        setStoredData(userProfileKey, JSON.stringify(profileData));
        
        // Update login info with current profile data
        const updatedLoginInfo = {
          name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          phoneNumber: profileData.phoneNumber,
          email: profileData.email
        };
        setStoredData('userLoginInfo', JSON.stringify(updatedLoginInfo));
        setCurrentUser(updatedLoginInfo);
        
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

  // Save current address
  const handleSaveAddress = () => {
    if (!currentUser) {
      setSaveMessage('Please log in to save addresses.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    if (!addressLabel.trim()) {
      setSaveMessage('Please enter an address label.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    const newAddress: SavedAddress = {
      id: Date.now().toString(),
      label: addressLabel,
      flatPlot: profileData.flatPlot,
      address: profileData.address,
      zipCode: profileData.zipCode,
      country: profileData.country,
      city: profileData.city,
      regionState: profileData.regionState,
      isDefault: savedAddresses.length === 0 // First address becomes default
    };

    const updatedAddresses = [...savedAddresses, newAddress];
    setSavedAddresses(updatedAddresses);
    
    const addressesKey = `savedAddresses_${currentUser.email}`;
    setStoredData(addressesKey, JSON.stringify(updatedAddresses));
    
    setAddressLabel('');
    setSaveMessage('Address saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Load saved address
  const handleLoadAddress = (addressId: string) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      setProfileData(prev => ({
        ...prev,
        flatPlot: address.flatPlot,
        address: address.address,
        zipCode: address.zipCode,
        country: address.country,
        city: address.city,
        regionState: address.regionState
      }));
      setShowAddressList(false);
      setSaveMessage(`Address "${address.label}" loaded successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Delete saved address
  const handleDeleteAddress = (addressId: string) => {
    const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
    setSavedAddresses(updatedAddresses);
    
    if (currentUser) {
      const addressesKey = `savedAddresses_${currentUser.email}`;
      setStoredData(addressesKey, JSON.stringify(updatedAddresses));
    }
    
    setSaveMessage('Address deleted successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
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
    
    if (currentUser) {
      const userProfileKey = `userProfile_${currentUser.email}`;
      removeStoredData(userProfileKey);
    }
    
    setSaveMessage('Profile cleared successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Logout function
  const handleLogout = () => {
    removeStoredData('userLoginInfo');
    setCurrentUser(null);
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
    setSavedAddresses([]);
    setSaveMessage('Logged out successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <>
      <Breadcrumb title="Profile" parent="home" />
      
      {/* Login Status */}
      {currentUser ? (
        <div className="alert alert-success d-flex justify-content-between align-items-center" role="alert">
          <span>Welcome back, {currentUser.name}! ({currentUser.email})</span>
          <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <div className="alert alert-warning" role="alert">
          Please log in to save and access your profile data.
        </div>
      )}
      
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0 spc-responsive">SHIPPING ADDRESS</h3>
                {currentUser && savedAddresses.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowAddressList(!showAddressList)}
                  >
                    {showAddressList ? 'Hide' : 'Show'} Saved Addresses ({savedAddresses.length})
                  </button>
                )}
              </div>
              
              {/* Saved Addresses List */}
              {showAddressList && savedAddresses.length > 0 && (
                <div className="mb-4 p-3 border rounded bg-white">
                  <h5>Your Saved Addresses</h5>
                  {savedAddresses.map((addr) => (
                    <div key={addr.id} className="border-bottom pb-2 mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{addr.label}</strong>
                          {addr.isDefault && <span className="badge badge-primary ml-2">Default</span>}
                          <div className="small text-muted">
                            {addr.flatPlot}, {addr.address}, {addr.city}, {addr.regionState}, {addr.zipCode}
                          </div>
                        </div>
                        <div>
                          <button 
                            className="btn btn-sm btn-outline-success mr-1"
                            onClick={() => handleLoadAddress(addr.id)}
                          >
                            Use
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
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
                  
                  {/* Save Address Section */}
                  {currentUser && (
                    <Col md="12">
                      <div className="border-top pt-3 mb-3">
                        <FormGroup>
                          <Label htmlFor="addressLabel">Save this address as:</Label>
                          <Input 
                            type="text" 
                            className="form-control mb-2" 
                            id="addressLabel" 
                            placeholder="e.g., Home, Office, Work" 
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value)}
                          />
                          <button 
                            className="btn btn-sm btn-outline-info" 
                            type="button"
                            onClick={handleSaveAddress}
                            disabled={!addressLabel.trim()}
                          >
                            Save Address
                          </button>
                        </FormGroup>
                      </div>
                    </Col>
                  )}
                  
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