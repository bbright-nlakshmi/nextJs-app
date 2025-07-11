import React, { useEffect } from "react";
import { Button, Col, Container, Form, FormGroup, Input, Row } from "reactstrap";
import { NextPage } from "next";

interface MobileSearchProps {
  onOpen: () => void;
}

const MobileSearch: NextPage<MobileSearchProps> = ({ onOpen }) => {
  return (
    <li className="onhover-div mobile-search">
      <i className="icon-search" onClick={onOpen}></i>
    </li>
  );
};

export default MobileSearch;
