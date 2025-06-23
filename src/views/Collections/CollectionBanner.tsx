import { NextPage } from "next";
import { Media } from "reactstrap";

interface Props {
  img?: string;
  name?: string;
  details?: string;
}

const CollectionBanner: NextPage<Props> = ({ img, name = "fashion", details }) => (
  <div className="top-banner-wrapper" >
    <a href="#">
      <Media src={img} className="img-fluid full-width"  alt={name} />
    </a>
    <div className="top-banner-content small-section">
      <h4>{name}</h4>
      <h5>{details ?? "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}</h5>
      <p>
        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
        industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book.
      </p>
    </div>
  </div>
);

export default CollectionBanner;
