import { NextPage } from "next";
import { Media } from "reactstrap";

interface Props {
  img?: string;
  name?: string;
  details?: string;
}

const CollectionBanner: NextPage<Props> = ({ img, name , details }) => { 

  
  return (
  <div className="top-banner-wrapper" >
    <a href="#">
      <Media src={img} className="img-fluid full-width"  alt={name} />
    </a>
    <div className="top-banner-content small-section">
      <h4>{name}</h4>
      <p>{details ?? "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}</p>
    </div>
  </div>
)};

export default CollectionBanner;
