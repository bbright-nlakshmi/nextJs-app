import React, { useEffect, useState } from "react";
import { Row } from "reactstrap";
import { NextPage } from "next";
import { Kit, objCache } from "@/app/globalProvider";
import { useSearchParams } from "next/navigation";
import KitThumbnail from "./kit-thumbnail";

const KitDetails: NextPage = () => {
  const [kit, setKit] = useState<Kit>();
  const searchParams = useSearchParams();
  const discountId = searchParams.get("id");

  useEffect(() => {
    let foundKit = objCache.kitList.find((item: Kit) => item.id === discountId);
    if (foundKit) {
        setKit(foundKit);
    }

    const handleUpdateKits = (kit_data: Kit[]) => {
        if (kit_data && kit_data.length > 0) {
            foundKit = kit_data.find((item) => item.id === discountId);
            if (foundKit) {
                setKit(foundKit);
            }
        }
    };

    objCache.on("updateKits", handleUpdateKits);

    return () => {
        objCache.off("updateKits", handleUpdateKits);
    };
}, [discountId]);

  return (
    <div className="collection-wrapper">
      <div className="custom-container">
        {kit && (
          <Row className="left-slick">
            <KitThumbnail item={kit} />
          </Row>
        )}
      </div>
    </div>
  );
};

export default KitDetails;
