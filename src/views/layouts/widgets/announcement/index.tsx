import { API } from "@/app/globalProvider";
import React, { Fragment, useEffect, useState } from "react";

type AnnouncementProps = { announce: string };

const Announcement: React.FC = () => {
    const [announcement, setAnnounecement] = useState<string>()
    useEffect(() => {
        async function fetchAnnouncement() {
            const response = await API.getStoreAnnounce();
            //const result = await response.json();
            setAnnounecement(response.announce);
        }
        fetchAnnouncement();
    }, []);
    if (announcement)
        return (
            <Fragment>


                <div className="sqs-announcement-bar-content">

                    <div className="sqs-announcement-bar-text">

                        <div id="announcement-bar-text-inner-id" className="sqs-announcement-bar-text-inner">
                            <p className="text-white" >{announcement}</p>
                        </div>
                    </div></div>


            </Fragment>
        );
};
export default Announcement;
